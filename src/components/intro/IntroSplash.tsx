import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { signalBus } from '@/lib/signalBus';
import { EASE_IN_OUT, EASE_OUT } from '@/config/motion';

/** Set to true to only play the intro once per browser tab session. */
export const INTRO_ONCE_PER_SESSION = false;
const KEY = 'nexus-intro-seen';

export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (!INTRO_ONCE_PER_SESSION) return true;
  try {
    return sessionStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}
export function markIntroSeen() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage unavailable: ignore */
  }
}

const LINES = [
  '> boot nexus-bus kernel',
  '> opening websocket gateway ........ ok',
  '> joining redis pub/sub cluster .... ok',
  '> syncing 6 nodes · sentinel quorum  ok',
  '> aurora engine online',
];
const TITLE = 'NEXUS//BUS'.split('');
const GRAD = ['#a78bfa', '#b685f4', '#c97fe6', '#e077d3', '#f472b6']; // colors for "//BUS"

/**
 * ~3.8s cinematic intro. Timeline (seconds):
 * 0.0 grid floor · 0.2–1.8 boot lines + progress · 2.0 logo draws · 2.5 title flips in
 * 3.0 tagline · 3.4 shockwave + aurora burst · 3.8 iris-wipe exit (handled by AnimatePresence)
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const counter = animate(0, 100, { duration: 1.6, delay: 0.2, ease: 'easeInOut', onUpdate: (v) => setPct(Math.round(v)) });
    const t1 = window.setTimeout(() => signalBus.burst(1.4), 3400);
    const t2 = window.setTimeout(onDone, 3800);
    return () => {
      counter.stop();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <motion.div
      role="presentation"
      className="fixed inset-0 z-[100] overflow-hidden bg-space-950"
      initial={{ clipPath: 'circle(150% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)', transition: { duration: 0.9, ease: EASE_IN_OUT } }}
    >
      {/* ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(139,92,246,.28),transparent),radial-gradient(40%_35%_at_55%_60%,rgba(236,72,153,.18),transparent)]" />

      {/* 3D perspective grid floor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden [perspective:500px]"
        style={{ maskImage: 'linear-gradient(to top, #000 10%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to top, #000 10%, transparent 95%)' }}
      >
        <motion.div
          className="absolute -inset-x-1/2 bottom-0 h-[180%]"
          style={{
            transform: 'rotateX(64deg)',
            transformOrigin: '50% 100%',
            backgroundImage:
              'linear-gradient(rgba(139,92,246,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(236,72,153,.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
          animate={{ backgroundPositionY: ['0px', '64px'] }}
          transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
        />
      </motion.div>

      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 1px, transparent 3px)' }}
      />

      <div className="absolute inset-0 grid place-items-center px-6">
        {/* ---------- boot terminal ---------- */}
        <motion.div
          className="absolute w-[min(520px,88vw)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -10] }}
          transition={{ duration: 1.9, times: [0, 0.12, 0.84, 1], delay: 0.1 }}
        >
          <div className="num space-y-1.5 text-[13px] text-violet-200/80">
            {LINES.map((l, i) => (
              <motion.div key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.3, duration: 0.3 }}>
                {l}
              </motion.div>
            ))}
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-accent-gradient shadow-glow-magenta"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.2, duration: 1.6, ease: 'easeInOut' }}
            />
          </div>
          <div className="num mt-2 text-right text-xs text-fuchsia-300">{pct}%</div>
        </motion.div>

        {/* ---------- logo + title ---------- */}
        <div className="relative flex flex-col items-center">
          <motion.div
            className="absolute -inset-20 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,.45),transparent)]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.0, duration: 0.9 }}
          />
          <motion.svg
            width="132"
            height="132"
            viewBox="0 0 32 32"
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 1.95, duration: 0.7, ease: EASE_OUT }}
            style={{ transformPerspective: 600 }}
            aria-hidden
          >
            <defs>
              <linearGradient id="intro-g" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            <motion.path
              d="M16 2l12 7v14l-12 7L4 23V9z"
              fill="url(#intro-g)"
              stroke="url(#intro-g)"
              strokeWidth="0.7"
              strokeLinejoin="round"
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 0.95 }}
              transition={{ pathLength: { delay: 2.0, duration: 0.8, ease: 'easeInOut' }, fillOpacity: { delay: 2.7, duration: 0.4 } }}
            />
            <motion.path
              d="M16 9l6 3.5v7L16 23l-6-3.5v-7z"
              fill="#030712"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.88 }}
              transition={{ delay: 2.7, duration: 0.3 }}
            />
            <motion.circle
              cx="16"
              cy="16"
              r="2.4"
              fill="#fff"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              style={{ transformOrigin: '16px 16px' }}
              transition={{ delay: 2.8, duration: 0.5 }}
            />
          </motion.svg>

          <div className="mt-6 flex text-5xl font-bold tracking-tight md:text-7xl [perspective:700px]" aria-label="NEXUS//BUS">
            {TITLE.map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={{ opacity: 0, y: 34, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 2.5 + i * 0.05, duration: 0.5, ease: EASE_OUT }}
                style={{ color: i < 5 ? '#fff' : GRAD[i - 5], display: 'inline-block' }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.p
            className="mt-3 text-sm tracking-[0.3em] text-violet-200/60 md:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 0.5 }}
          >
            DISTRIBUTED · REAL-TIME · OBSERVABLE
          </motion.p>
        </div>
      </div>

      {/* shockwave + flash */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-20 -mt-20 h-40 w-40 rounded-full border-2 border-fuchsia-400/70"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 18], opacity: [0, 0.9, 0] }}
        transition={{ delay: 3.4, duration: 1.1, ease: EASE_OUT, times: [0, 0.05, 1] }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,.55),rgba(139,92,246,.35),transparent)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ delay: 3.4, duration: 0.7, times: [0, 0.2, 1] }}
      />

      <button
        onClick={onDone}
        className="glass absolute bottom-6 right-6 rounded-full px-4 py-1.5 text-xs text-violet-100 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-accent-violet/70"
      >
        Skip intro ›
      </button>
    </motion.div>
  );
}