import { useTelemetry } from '@/services/telemetryStore';
import { Depth, GlassCard } from '@/components/ui/GlassCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { LiveChart } from './charts';
import { TopologyScene } from './TopologyScene';
import { RedisNodeGrid } from './RedisNodeGrid';
import { fmtCompact } from '@/lib/utils';

function Kpi({ label, value, decimals = 0, suffix = '' }: { label: string; value: number; decimals?: number; suffix?: string }) {
  return (
    <GlassCard radius={16} maxTilt={10}>
      <div className="p-3.5">
        <Depth z={14}><div className="label">{label}</div></Depth>
        <Depth z={26}><div className="num mt-1 text-2xl font-semibold text-white"><AnimatedNumber value={value} decimals={decimals} suffix={suffix} /></div></Depth>
      </div>
    </GlassCard>
  );
}

/** Recruiter-facing "Event Bus Metrics": WS latency, Redis Pub/Sub nodes, packet throughput. */
export function EventBusPanel() {
  const tick = useTelemetry((s) => s.tick);
  const throughput = useTelemetry((s) => s.throughput);
  const latency = useTelemetry((s) => s.latency);
  const nodes = useTelemetry((s) => s.nodes);
  const total = useTelemetry((s) => s.totalPackets);

  return (
    <aside className="scroll-thin flex flex-col gap-3 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto lg:pr-1">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold tracking-wide text-white">Event Bus Metrics</h2>
        <span className="num text-[11px] text-violet-200/40">{fmtCompact(total)} pkts total</span>
      </div>

      <GlassCard radius={22} maxTilt={3}>
        <div className="relative">
          <span className="label absolute left-4 top-3 z-10">Cluster topology · 3D</span>
          <TopologyScene height={230} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="WS Latency" value={tick?.wsLatencyMs ?? 0} decimals={1} suffix=" ms" />
        <Kpi label="p99" value={tick?.p99Ms ?? 0} decimals={0} suffix=" ms" />
        <Kpi label="Packets / s" value={tick?.packetsPerSec ?? 0} />
        <Kpi label="Throughput" value={(tick?.bytesPerSec ?? 0) / 1024} decimals={0} suffix=" KB/s" />
      </div>

      <GlassCard radius={20} maxTilt={4}>
        <div className="p-4">
          <Depth z={14} className="mb-2 flex items-center justify-between"><span className="label">Packet throughput · 60s</span><span className="num text-[11px] text-fuchsia-300">{Math.round(tick?.packetsPerSec ?? 0)} /s</span></Depth>
          <LiveChart data={throughput} height={110} label="Packet throughput over the last 60 seconds" />
        </div>
      </GlassCard>

      <GlassCard radius={20} maxTilt={4}>
        <div className="p-4">
          <Depth z={14} className="mb-2 flex items-center justify-between"><span className="label">WebSocket latency · 60s</span><span className="num text-[11px] text-violet-300">{(tick?.wsLatencyMs ?? 0).toFixed(1)} ms</span></Depth>
          <LiveChart data={latency} height={80} area={false} label="WebSocket latency over the last 60 seconds" />
        </div>
      </GlassCard>

      <div className="px-1 pt-1"><span className="label">Redis Pub/Sub nodes</span></div>
      <RedisNodeGrid nodes={nodes} />
    </aside>
  );
}