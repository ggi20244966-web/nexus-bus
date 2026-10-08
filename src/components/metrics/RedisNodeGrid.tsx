import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Depth, GlassCard } from '@/components/ui/GlassCard';
import { fmtCompact } from '@/lib/utils';
import { staggerParent, riseIn } from '@/config/motion';
import type { NodeStatus, RedisNode } from '@/types/telemetry';

const DOT: Record<NodeStatus, string> = { healthy: 'bg-emerald-400', degraded: 'bg-amber-400', down: 'bg-rose-500' };

export function RedisNodeGrid({ nodes }: { nodes: RedisNode[] }) {
  if (nodes.length === 0) return <p className="py-6 text-center text-xs text-violet-200/40">Awaiting node heartbeat…</p>;
  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5">
      {nodes.map((n) => (
        <motion.div key={n.id} variants={riseIn}>
          <GlassCard radius={14} maxTilt={9}>
            <div className="p-3">
              <Depth z={16} className="flex items-center gap-2">
                <span className={clsx('h-2 w-2 rounded-full', DOT[n.status], n.status !== 'healthy' && 'animate-pulseDot')} />
                <span className="num truncate text-[11px] font-medium text-white">{n.id}</span>
              </Depth>
              <Depth z={8}>
                <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-violet-300/50">
                  <span>{n.role}</span><span>{n.region}</span>
                </div>
                <div className="num mt-2 flex justify-between text-[11px] text-violet-100/80">
                  <span>{fmtCompact(n.opsPerSec)} ops/s</span>
                  <span className={n.lagMs > 25 ? 'text-amber-300' : ''}>{n.lagMs.toFixed(1)}ms lag</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-accent-gradient" animate={{ width: `${n.memPct}%` }} transition={{ duration: 0.8 }} />
                </div>
              </Depth>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}