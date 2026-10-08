import { useId } from 'react';
import { motion } from 'framer-motion';

const W = 400;
const H = 120;

/** Catmull-Rom → cubic Bézier. Constant segment count so framer-motion can tween `d` smoothly. */
function smoothPath(pts: [number, number][]): string {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function project(data: number[], max: number): [number, number][] {
  const n = data.length;
  return data.map((v, i) => [(i / (n - 1)) * W, H - 8 - Math.min(1, v / max) * (H - 20)]);
}

interface ChartProps { data: number[]; height?: number; label?: string; area?: boolean }

export function LiveChart({ data, height = 120, label, area = true }: ChartProps) {
  const id = useId().replace(/:/g, '');
  const peak = Math.max(...data, 1);
  const max = peak * 1.15;
  const pts = project(data, max);
  const line = smoothPath(pts);
  const fill = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];
  const t = { duration: 0.95, ease: 'linear' as const };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} style={{ height }} className="w-full overflow-visible">
      <defs>
        <linearGradient id={`s${id}`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#EC4899" /></linearGradient>
        <linearGradient id={`a${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8B5CF6" stopOpacity=".38" /><stop offset="1" stopColor="#EC4899" stopOpacity="0" /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,.06)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      ))}
      {area && <motion.path initial={false} animate={{ d: fill }} transition={t} fill={`url(#a${id})`} />}
      <motion.path initial={false} animate={{ d: line }} transition={t} fill="none" stroke={`url(#s${id})`} strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 6px rgba(236,72,153,.7))' }} />
      <motion.circle initial={false} animate={{ cx: last[0], cy: last[1] }} transition={t} r={3.4} fill="#fff" style={{ filter: 'drop-shadow(0 0 6px #EC4899)' }} />
    </svg>
  );
}