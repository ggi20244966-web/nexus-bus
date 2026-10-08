import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AccordionItem } from '@/components/ui/Accordion';
import { useTelemetry } from '@/services/telemetryStore';
import { LiveChart } from './charts';
import { TopologyScene } from './TopologyScene';
import { GlassCard } from '@/components/ui/GlassCard';
import { staggerParent, riseIn } from '@/config/motion';
import { fmtCompact } from '@/lib/utils';

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/[0.035] px-3.5 py-2.5">
      <div className="label">{k}</div>
      <div className="num mt-0.5 text-[15px] text-white">{v}</div>
    </div>
  );
}
const Grid = ({ children }: { children: ReactNode }) => (
  <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
    {Array.isArray(children) ? children.map((c, i) => <motion.div key={i} variants={riseIn}>{c}</motion.div>) : children}
  </motion.div>
);
const Badge = ({ children }: { children: ReactNode }) => <span className="num rounded-lg bg-white/5 px-2.5 py-1 text-xs text-fuchsia-200">{children}</span>;

export function MetricInspector() {
  const [open, setOpen] = useState<string[]>(['gateway']);
  const tick = useTelemetry((s) => s.tick);
  const nodes = useTelemetry((s) => s.nodes);
  const latency = useTelemetry((s) => s.latency);
  const p99 = useTelemetry((s) => s.p99);
  const throughput = useTelemetry((s) => s.throughput);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const healthy = nodes.filter((n) => n.status === 'healthy').length;
  const avgLag = nodes.length ? nodes.reduce((s, n) => s + n.lagMs, 0) / nodes.length : 0;
  const fanout = tick ? tick.packetsPerSec * 3.4 : 0;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
      <GlassCard radius={24} maxTilt={2}>
        <div className="relative">
          <span className="label absolute left-5 top-4 z-10">Live cluster topology · packets stream hub → Redis nodes</span>
          <TopologyScene height={340} />
        </div>
      </GlassCard>

      <AccordionItem id="gateway" title="WebSocket Gateway" subtitle="Socket.io · binary frames · sticky sessions" open={open.includes('gateway')} onToggle={() => toggle('gateway')} badge={<Badge>{(tick?.wsLatencyMs ?? 0).toFixed(1)} ms</Badge>}>
        <Grid>
          <KV k="Active sockets" v={(tick?.activeSockets ?? 0).toLocaleString()} />
          <KV k="Latency (avg)" v={`${(tick?.wsLatencyMs ?? 0).toFixed(1)} ms`} />
          <KV k="Latency p99" v={`${(tick?.p99Ms ?? 0).toFixed(0)} ms`} />
          <KV k="Inbound" v={`${fmtCompact(tick?.bytesPerSec ?? 0)}B/s`} />
        </Grid>
        <div className="mt-4"><LiveChart data={latency} height={90} label="Latency history" /></div>
      </AccordionItem>

      <AccordionItem id="redis" title="Redis Pub/Sub Cluster" subtitle="Primary + replicas, Sentinel quorum" open={open.includes('redis')} onToggle={() => toggle('redis')} badge={<Badge>{healthy}/{nodes.length} healthy</Badge>}>
        <Grid>
          <KV k="Nodes healthy" v={`${healthy} / ${nodes.length}`} />
          <KV k="Avg replica lag" v={`${avgLag.toFixed(1)} ms`} />
          <KV k="Total ops/s" v={fmtCompact(nodes.reduce((s, n) => s + n.opsPerSec, 0))} />
          <KV k="Peak memory" v={`${Math.max(0, ...nodes.map((n) => n.memPct)).toFixed(0)} %`} />
        </Grid>
        <div className="mt-4 overflow-x-auto">
          <table className="num w-full text-left text-xs">
            <thead className="text-violet-300/50"><tr>{['Node', 'Role', 'Region', 'Status', 'Lag', 'Mem'].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id} className="border-t border-white/5 text-violet-50/80">
                  <td className="py-1.5">{n.id}</td><td>{n.role}</td><td>{n.region}</td>
                  <td className={n.status === 'healthy' ? 'text-emerald-300' : n.status === 'degraded' ? 'text-amber-300' : 'text-rose-400'}>{n.status}</td>
                  <td>{n.lagMs.toFixed(1)} ms</td><td>{n.memPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionItem>

      <AccordionItem id="fanout" title="Fan-out Pipeline" subtitle="Publish → Redis channel → gateway subscribers" open={open.includes('fanout')} onToggle={() => toggle('fanout')} badge={<Badge>{fmtCompact(fanout)} deliveries/s</Badge>}>
        <Grid>
          <KV k="Publishes / s" v={Math.round(tick?.packetsPerSec ?? 0).toLocaleString()} />
          <KV k="Avg fan-out ratio" v="3.4×" />
          <KV k="Deliveries / s" v={fmtCompact(fanout)} />
          <KV k="Dropped" v="0.00 %" />
        </Grid>
        <div className="mt-4"><LiveChart data={throughput} height={90} label="Throughput history" /></div>
      </AccordionItem>

      <AccordionItem id="tail" title="Tail Latency Budget" subtitle="p99 vs 120 ms SLO" open={open.includes('tail')} onToggle={() => toggle('tail')} badge={<Badge>SLO 120 ms</Badge>}>
        <LiveChart data={p99} height={90} label="p99 latency history" />
      </AccordionItem>
    </div>
  );
}