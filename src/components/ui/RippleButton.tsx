import { useCallback, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/config/motion';
import { signalBus } from '@/lib/signalBus';

interface Ripple { id: number; x: number; y: number; size: number }

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
  /** kick the WebGL aurora on press */
  burst?: number;
}

let rid = 0;

/** Ripple-burst button with tactile spring press physics. */
export function RippleButton({ variant = 'primary', className, children, onPointerDown, burst = 0.6, ...rest }: Props) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const id = ++rid;
      setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top, size }]);
      signalBus.burst(burst);
      onPointerDown?.(e);
    },
    [burst, onPointerDown],
  );

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.9, y: 1 }}
      transition={spring.bounce}
      onPointerDown={handleDown}
      className={clsx(
        'relative isolate overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-accent-violet/70 disabled:opacity-40 disabled:pointer-events-none',
        variant === 'primary' ? 'bg-accent-gradient text-white shadow-glow-magenta' : 'glass text-violet-100',
        className,
      )}
      {...rest}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <AnimatePresence>
        {ripples.map((rp) => (
          <motion.span
            key={rp.id}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            onAnimationComplete={() => setRipples((rs) => rs.filter((x) => x.id !== rp.id))}
            className="pointer-events-none absolute rounded-full bg-white/70"
            style={{ left: rp.x - rp.size / 2, top: rp.y - rp.size / 2, width: rp.size, height: rp.size }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}