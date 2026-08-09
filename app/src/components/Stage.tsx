import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';

interface StageProps {
  width: number;
  height: number;
  children: ReactNode;
  /**
   * When provided, the artboard scales to FIT this element's content box
   * (measured live via ResizeObserver). Used for the dashboard preview, where
   * the "projector" is a small 16:9 card rather than the whole window.
   * When omitted, it fits the browser window (the real projector route).
   */
  fitRef?: RefObject<HTMLElement | null>;
}

/**
 * Centers a fixed-pixel artboard in the viewport and scales it to fit.
 *
 * NOTE: CSS cannot produce a *unitless* ratio of viewport-size to pixels
 * (you can't divide a length by a length inside calc()), and transform:
 * scale() requires a unitless number — so we compute the factor in JS from
 * element dimensions and listen for resize / box changes. (The previous
 * attempt used `scale(min(calc(100vw / 1920px), ...))`, which is invalid CSS
 * and was silently dropped by the browser, leaving the 1920x1080 div at its
 * literal size — i.e. the "UI goes massive" bug.)
 */
export default function Stage({ width, height, children, fitRef }: StageProps) {
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined'
      ? Math.min(window.innerWidth / width, window.innerHeight / height)
      : 1,
  );

  useEffect(() => {
    const compute = () => {
      const w = fitRef?.current?.clientWidth ?? window.innerWidth;
      const h = fitRef?.current?.clientHeight ?? window.innerHeight;
      setScale(Math.min(w / width, h / height));
    };
    compute();
    window.addEventListener('resize', compute);
    let ro: ResizeObserver | undefined;
    if (fitRef?.current) {
      ro = new ResizeObserver(compute);
      ro.observe(fitRef.current);
    }
    return () => {
      window.removeEventListener('resize', compute);
      ro?.disconnect();
    };
  }, [width, height, fitRef]);

  const outerStyle: CSSProperties = {
    width: fitRef ? '100%' : '100vw',
    height: fitRef ? '100%' : '100vh',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const innerStyle: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    flexShrink: 0,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
  };

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
}
