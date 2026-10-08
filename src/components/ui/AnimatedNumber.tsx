import { useEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';

export function AnimatedNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, mv]);

  useEffect(
    () =>
      mv.on('change', (v) => {
        if (ref.current) ref.current.textContent = v.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      }),
    [mv, decimals, suffix],
  );

  return <span ref={ref}>{value.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix}</span>;
}