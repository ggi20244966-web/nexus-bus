import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroScene } from './HeroScene';
import { GlassCard, Depth } from '@/components/ui/GlassCard';
import { RippleButton } from '@/components/ui/RippleButton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useTelemetry } from '@/services/telemetryStore';
import { riseIn, staggerParent } from '@/config/motion';
import type { View } from '@/components/layout/Header';

const FEATURES = [
  { n: '01', title: 'Sub-50 ms fan-out', body: 'Binary frames over persistent WebSockets, routed through Redis Pub/Sub so every subscriber hears a publish almost instantly.' },
  { n: '02', title: 'Redis backbone', body: 'Primary, replicas and Sentinel quorum with live lag, memory and ops/sec visible per node.' },
  { n: '03', title: 'Self-healing clients', body: 'Automatic reconnect with backoff, and a seamless switch between live and simulated feeds.' },
  { n: '04', title: 'Backpressure aware', body: 'Presence pings shed first, messages never. Watch drops and queue depth in the inspector.' },
  { n: '05', title: 'Observability built in', body: 'Latency, p99, throughput and cluster topology on one screen. No separate dashboard tool.' },
  { n: '06', title: 'Scales horizontally', body: 'Add gateway instances behind a load balancer. The Redis adapter keeps every room in sync.' },
];

const STACK = ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'Socket.io', 'Redis Pub/Sub', 'Vite'];

const BOXES = [
  { x: 10, t: 'Clients', s: 'Browsers · WebSocket' },
  { x: 240, t: 'Gateway', s: 'Socket.io · sticky' },
  { x: 470, t: 'Redis', s: 'Pub/Sub · Sentinel' },
  { x: 700, t: 'Subscribers', s: 'Fan-out · ack' },
];

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <motion.div variants={riseIn} className="mb-8 text-center">
      <div className="label">{kicker}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    </motion.div>
  );
}

function Architecture() {
  return (
    <svg viewBox="0 0 900 200" className="w-full" role="img" aria-label="Clients to gateway to Redis to subscribers">
      <defs>
        <linearGradient id="archg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {BOXES.slice(0, -1).map((b, i) => {
        const d = `M${b.x + 170},100 H${BOXES[i + 1].x}`;
        return (
          <g key={b.t}>
            <path d={d} stroke="url(#archg)" strokeWidth="2" strokeDasharray="4 6" fill="none" opacity="0.7" />
            {[0, 0.8].map((delay) => (
              <circle key={delay} r="4" fill="#f9a8d4">
                <animateMotion dur="1.6s" begin={`${delay + i * 0.3}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
          </g>
        );
      })}
      {BOXES.map((b) => (
        <g key={b.t}>
          <rect x={b.x} y="50" width="170" height="100" rx="18" fill="rgba(255,255,255,0.05)" stroke="url(#archg)" strokeWidth="1.5" />
          <text x={b.x + 85} y="95" fill="#fff" fontSize="19" fontWeight="600" textAnchor="middle">{b.t}</text>
          <text x={b.x + 85} y="120" fill="#c4b5fd" fontSize="12" textAnchor="middle">{b.s}</text>
        </g>
      ))}
    </svg>
  );
}

function Marquee() {
  const items = [...STACK, ...STACK];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <motion.div className="flex w-max" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, ease: 'linear', repeat: Infinity }}>
        {items.map((s, i) => (
          <span key={i} className="glass mr-4 whitespace-nowrap rounded-full px-5 py-2 text-sm text-violet-100">{s}</span>
        ))}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, decimals = 0, suffix = '' }: { label: string; value: number; decimals?: number; suffix?: string }) {
  return (
    <GlassCard radius={20} maxTilt={9}>
      <div className="p-5 text-center">
        <Depth z={14}><div className="label">{label}</div></Depth>
        <Depth z={30}>
          <div className="num text-gradient mt-2 text-3xl font-semibold md:text-4xl">
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          </div>
        </Depth>
      </div>
    </GlassCard>
  );
}

export function HomePage({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { scrollY } = useScroll();
  const sceneY = useTransform(scrollY, [0, 600], [0, 90]);
  const textY = useTransform(scrollY, [0, 600], [0, -50]);

  const latency = useTelemetry((s) => s.tick?.wsLatencyMs ?? 0);
  const pps = useTelemetry((s) => s.tick?.packetsPerSec ?? 0);
  const sockets = useTelemetry((s) => s.tick?.activeSockets ?? 0);
  const healthy = useTelemetry((s) => s.nodes.filter((n) => n.status === 'healthy').length);
  const total = useTelemetry((s) => s.nodes.length);

  return (
    <div className="space-y-24 pb-10">
      {/* HERO */}
      <section className="grid min-h-[600px] items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
        <motion.div style={{ y: textY }} variants={staggerParent} initial="hidden" animate="show" className="relative z-10">
          <motion.span variants={riseIn} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-violet-100">
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-emerald-400" />
            Distributed · Real-time · Observable
          </motion.span>
          <motion.h1 variants={riseIn} className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Messaging at the <span className="text-gradient">speed of light.</span>
          </motion.h1>
          <motion.p variants={riseIn} className="mt-5 max-w-xl text-lg leading-relaxed text-violet-100/70">
            A distributed WebSocket engine backed by Redis Pub/Sub, with live latency, throughput and cluster health you can actually watch.
          </motion.p>
          <motion.div variants={riseIn} className="mt-8 flex flex-wrap gap-3">
            <RippleButton onClick={() => onNavigate('live')} burst={1}>Launch Live Console →</RippleButton>
            <RippleButton variant="ghost" onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Architecture
            </RippleButton>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: sceneY }} className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgba(139,92,246,.35),transparent)]" />
          <HeroScene height={520} />
        </motion.div>
      </section>

      {/* LIVE STATS */}
      <motion.section variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={riseIn}><Stat label="WS latency" value={latency} decimals={1} suffix=" ms" /></motion.div>
        <motion.div variants={riseIn}><Stat label="Packets / s" value={pps} /></motion.div>
        <motion.div variants={riseIn}><Stat label="Active sockets" value={sockets} /></motion.div>
        <motion.div variants={riseIn}><Stat label="Nodes healthy" value={healthy} suffix={` / ${total}`} /></motion.div>
      </motion.section>

      {/* FEATURES */}
      <motion.section variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
        <SectionTitle kicker="Capabilities" title="Built for throughput, designed to be seen" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div key={f.n} variants={riseIn}>
              <GlassCard radius={22}>
                <div className="p-6">
                  <Depth z={30}><div className="num text-gradient text-3xl font-bold">{f.n}</div></Depth>
                  <Depth z={20}><h3 className="mt-3 text-lg font-semibold text-white">{f.title}</h3></Depth>
                  <Depth z={8}><p className="mt-2 text-sm leading-relaxed text-violet-100/65">{f.body}</p></Depth>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ARCHITECTURE */}
      <motion.section id="architecture" variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
        <SectionTitle kicker="Architecture" title="From click to every subscriber" />
        <motion.div variants={riseIn}>
          <GlassCard radius={26} maxTilt={3}>
            <div className="p-6 md:p-10"><Architecture /></div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* STACK */}
      <section>
        <div className="label mb-5 text-center">Tech stack</div>
        <Marquee />
      </section>

      {/* CTA */}
      <motion.section variants={riseIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
        <GlassCard radius={28} maxTilt={3}>
          <div className="px-6 py-14 text-center md:py-20">
            <Depth z={30}>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                See the bus <span className="text-gradient">breathe in real time.</span>
              </h2>
            </Depth>
            <Depth z={16}>
              <p className="mx-auto mt-4 max-w-xl text-violet-100/65">Open the console, send a message and watch the aurora, the metrics and the 3D cluster react.</p>
              <div className="mt-8 flex justify-center gap-3">
                <RippleButton onClick={() => onNavigate('live')} burst={1.2}>Open Live Console</RippleButton>
                <RippleButton variant="ghost" onClick={() => onNavigate('inspector')}>View Inspector</RippleButton>
              </div>
            </Depth>
          </div>
        </GlassCard>
      </motion.section>

      <footer className="pb-4 text-center text-xs text-violet-200/40">NEXUS//BUS · Distributed Real-Time Communication Engine</footer>
    </div>
  );
}