import { useEffect, useRef, useState, type MutableRefObject } from 'react';

/**
 * Captures microphone input and computes a smoothed RMS amplitude (0–1)
 * via the Web Audio API. The amplitude lives in a ref so consumers can
 * read it inside a rAF loop without triggering React re-renders.
 *
 * Audio capture only starts when `enabled` is true and stops when it
 * flips back to false (or the component unmounts).
 *
 * @returns `{ level, hasMic }` where `level` is a mutable ref holding the
 *          latest RMS value and `hasMic` reflects whether mic access succeeded.
 */
export default function useAudioLevel(enabled: boolean): {
  level: MutableRefObject<number>;
  hasMic: boolean;
} {
  const levelRef = useRef(0);
  const [hasMic, setHasMic] = useState(false);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const data = new Uint8Array(128);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        contextRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        setHasMic(true);

        const tick = () => {
          rafRef.current = requestAnimationFrame(tick);
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          levelRef.current = levelRef.current * 0.7 + rms * 0.3;
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) setHasMic(false);
      });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      contextRef.current?.close();
      streamRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      contextRef.current = null;
      levelRef.current = 0;
      setHasMic(false);
    };
  }, [enabled]);

  return { level: levelRef, hasMic };
}
