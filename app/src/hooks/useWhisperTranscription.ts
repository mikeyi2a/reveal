import { useEffect, useRef, useState } from 'react';
import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/whisper-base';
const SAMPLE_RATE = 16000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

const SILENCE_RMS_THRESHOLD = 0.012;
const SILENCE_HOLD_MS = 900;
const MIN_UTTERANCE_SAMPLES = SAMPLE_RATE * 0.3;
const MAX_UTTERANCE_SECONDS = 30;
const PARTIAL_INTERVAL_MS = 900;

export type WhisperBackend = 'webgpu' | 'wasm';

export type WhisperStatus =
  | 'idle'
  | 'requesting-mic'
  | 'loading-model'
  | 'listening'
  | 'error';

export interface TranscriptSegment {
  id: string;
  text: string;
  final: boolean;
}

export interface UseWhisperTranscriptionResult {
  segments: TranscriptSegment[];
  status: WhisperStatus;
  backend: WhisperBackend | null;
  error: string | null;
  modelLoadMs: number | null;
}

function downsampleTo16kHz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === SAMPLE_RATE) return input;
  const ratio = inputSampleRate / SAMPLE_RATE;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const indexLow = Math.floor(srcIndex);
    const indexHigh = Math.min(indexLow + 1, input.length - 1);
    const frac = srcIndex - indexLow;
    result[i] = input[indexLow] * (1 - frac) + input[indexHigh] * frac;
  }
  return result;
}

function computeRms(chunk: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
  return Math.sqrt(sum / chunk.length);
}

function appendFloat32(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function detectWebGpu(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

async function loadTranscriber(preferWebGpu: boolean): Promise<{ transcriber: AutomaticSpeechRecognitionPipeline; backend: WhisperBackend }> {
  if (preferWebGpu) {
    try {
      const transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, { device: 'webgpu' });
      return { transcriber, backend: 'webgpu' };
    } catch (err) {
      console.warn('[useWhisperTranscription] WebGPU pipeline load failed, falling back to WASM.', err);
    }
  }
  const transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, { device: 'wasm' });
  return { transcriber, backend: 'wasm' };
}

export function useWhisperTranscription(enabled: boolean = true): UseWhisperTranscriptionResult {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [backend, setBackend] = useState<WhisperBackend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelLoadMs, setModelLoadMs] = useState<number | null>(null);

  const transcriberRef = useRef<AutomaticSpeechRecognitionPipeline | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const bufferRef = useRef<Float32Array>(new Float32Array(0));
  const speakingRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const nextIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = new Float32Array(0);
      speakingRef.current = false;
      activeIdRef.current = null;
      setStatus('idle');
      return;
    }
    let cancelled = false;
    const partialTimer = setInterval(() => {
      void runPartialTranscription();
    }, PARTIAL_INTERVAL_MS);

    async function runPartialTranscription() {
      if (cancelled || !enabled || busyRef.current) return;
      if (!speakingRef.current || !activeIdRef.current) return;
      const transcriber = transcriberRef.current;
      if (!transcriber) return;
      const snapshot = bufferRef.current;
      if (snapshot.length < MIN_UTTERANCE_SAMPLES) return;

      busyRef.current = true;
      try {
        const output = await transcriber(snapshot, { language: 'english', task: 'transcribe' });
        const text = (Array.isArray(output) ? output[0]?.text : output.text)?.trim() ?? '';
        if (!cancelled && text && activeIdRef.current) {
          const id = activeIdRef.current;
          setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
        }
      } catch (err) {
        console.error('[useWhisperTranscription] partial transcription failed', err);
      } finally {
        busyRef.current = false;
      }
    }

    async function finalizeUtterance() {
      const id = activeIdRef.current;
      const audio = bufferRef.current;
      bufferRef.current = new Float32Array(0);
      speakingRef.current = false;
      activeIdRef.current = null;
      if (!id || audio.length < MIN_UTTERANCE_SAMPLES) {
        if (id) setSegments((prev) => prev.filter((s) => s.id !== id));
        return;
      }

      const transcriber = transcriberRef.current;
      if (!transcriber) return;

      while (busyRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (cancelled) return;
      }
      busyRef.current = true;
      try {
        const output = await transcriber(audio, { language: 'english', task: 'transcribe' });
        const text = (Array.isArray(output) ? output[0]?.text : output.text)?.trim() ?? '';
        if (!cancelled) {
          if (text) {
            setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, text, final: true } : s)));
          } else {
            setSegments((prev) => prev.filter((s) => s.id !== id));
          }
        }
      } catch (err) {
        console.error('[useWhisperTranscription] final transcription failed', err);
      } finally {
        busyRef.current = false;
      }
    }

    function handleChunk(chunk: Float32Array) {
      if (!enabled) return;
      const rms = computeRms(chunk);
      const isSpeech = rms > SILENCE_RMS_THRESHOLD;
      const now = performance.now();

      if (isSpeech) {
        lastSpeechAtRef.current = now;
        if (!speakingRef.current) {
          speakingRef.current = true;
          const id = `seg-${nextIdRef.current++}`;
          activeIdRef.current = id;
          setSegments((prev) => [...prev.slice(-19), { id, text: '', final: false }]);
        }
        bufferRef.current = appendFloat32(bufferRef.current, chunk);
      } else if (speakingRef.current) {
        bufferRef.current = appendFloat32(bufferRef.current, chunk);
        if (now - lastSpeechAtRef.current > SILENCE_HOLD_MS) {
          void finalizeUtterance();
        }
      }

      if (bufferRef.current.length / SAMPLE_RATE > MAX_UTTERANCE_SECONDS) {
        void finalizeUtterance();
      }
    }

    async function init() {
      setStatus('requesting-mic');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        if (!cancelled) {
          console.error('[useWhisperTranscription] mic permission denied', err);
          setStatus('error');
          setError('Microphone access was denied. Allow microphone permission for this site and reload.');
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setStatus('loading-model');

      const preferWebGpu = await detectWebGpu();
      const loadStart = performance.now();
      let loaded: { transcriber: AutomaticSpeechRecognitionPipeline; backend: WhisperBackend };
      try {
        loaded = await loadTranscriber(preferWebGpu);
      } catch (err) {
        if (!cancelled) {
          console.error('[useWhisperTranscription] failed to load Whisper on WebGPU and WASM', err);
          setStatus('error');
          setError('Could not load the speech model (no WebGPU or WASM backend available in this browser).');
        }
        return;
      }
      if (cancelled) return;

      const loadMs = performance.now() - loadStart;
      console.info(`[useWhisperTranscription] ${MODEL_ID} loaded on ${loaded.backend} in ${loadMs.toFixed(0)}ms`);
      transcriberRef.current = loaded.transcriber;
      setModelLoadMs(loadMs);
      setBackend(loaded.backend);

      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        console.info(`[useWhisperTranscription] AudioContext sample rate: ${audioContext.sampleRate}Hz, resampling to ${SAMPLE_RATE}Hz`);
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
        processorRef.current = processor;
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleTo16kHz(input, audioContext.sampleRate);
          handleChunk(downsampled);
        };

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(audioContext.destination);

        setStatus('listening');
      } catch (err) {
        if (!cancelled) {
          console.error('[useWhisperTranscription] failed to set up audio capture', err);
          setStatus('error');
          setError('Could not start audio capture from the microphone.');
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      clearInterval(partialTimer);
      processorRef.current?.disconnect();
      audioContextRef.current?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void transcriberRef.current?.dispose();
    };
  }, [enabled]);

  return { segments, status, backend, error, modelLoadMs };
}
