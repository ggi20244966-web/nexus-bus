import { useMemo, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { buildArchive, type ArchiveDay } from '@/lib/seed';
import { GlassCard, Depth } from '@/components/ui/GlassCard';
import { fmtTime } from '@/lib/utils';
import type { ChatMessage } from '@/types/telemetry';
import type { RefObject } from 'react';

function Row({ m, container }: { m: ChatMessage; container: RefObject<HTMLDivElement> }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ['start end', 'end start'] });
  // velocity-free depth parallax: rows drift opposite to scroll, fade in as they enter
  const y = useTransform(scrollYProgress, [0, 1], [28, -28]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0.25]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.96, 1]);
  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <b className="text-sm text-white">{m.author}</b>
        <span className="num text-violet-200/40">{fmtTime(m.ts)}</span>
        <span className="num rounded bg-white/5 px-1.5 py-0.5 text-violet-300/70">#{m.room}</span>
        <span className="num rounded bg-white/5 px-1.5 py-0.5 text-violet-300/70">{m.node}</span>
        <span className="num ml-auto text-fuchsia-300/80">{m.latencyMs} ms</span>
      </div>
      <p className="mt-1.5 text-sm text-violet-50/85">{m.body}</p>
    </motion.div>
  );
}

function Day({ day, container }: { day: ArchiveDay; container: RefObject<HTMLDivElement> }) {
  return (
    <section className="grid gap-5 md:grid-cols-[230px_1fr]">
      {/* pinned day summary — stays put while the messages scroll past */}
      <div className="md:sticky md:top-4 md:self-start">
        <GlassCard radius={20}>
          <div className="p-5">
            <Depth z={24}><div className="text-gradient text-xl font-bold leading-tight">{day.label}</div></Depth>
            <Depth z={12}>
              <dl className="num mt-4 space-y-2 text-xs text-violet-100/70">
                <div className="flex justify-between"><dt>Messages</dt><dd className="text-white">{day.messages.length}</dd></div>
                <div className="flex justify-between"><dt>Avg latency</dt><dd className="text-white">{day.avgLatency} ms</dd></div>
                <div className="flex justify-between"><dt>Peak pkts/s</dt><dd className="text-white">{day.peakPackets.toLocaleString()}</dd></div>
              </dl>
            </Depth>
          </div>
        </GlassCard>
      </div>
      <div className="flex flex-col gap-3 pb-10">
        {day.messages.map((m) => <Row key={m.id} m={m} container={container} />)}
      </div>
    </section>
  );
}

/** Message archive: sticky-pinned day summaries + velocity-skewed list with per-row parallax reveal. */
export function HistoryArchive() {
  const scroller = useRef<HTMLDivElement>(null);
  const days = useMemo(() => buildArchive(6), []);
  const { scrollY, scrollYProgress } = useScroll({ container: scroller });
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const skew = useTransform(smooth, [-2500, 0, 2500], [-2.5, 0, 2.5], { clamp: true });

  return (
    <div className="relative">
      <motion.div style={{ scaleX: scrollYProgress, originX: 0 }} className="absolute inset-x-0 top-0 z-10 h-[3px] bg-accent-gradient shadow-glow-magenta" />
      <div ref={scroller} className="scroll-thin h-[calc(100vh-130px)] overflow-y-auto rounded-3xl px-1 pr-3 pt-4">
        <motion.div style={{ skewY: skew }} className="mx-auto flex max-w-[1100px] flex-col gap-10">
          {days.map((d) => <Day key={d.key} day={d} container={scroller} />)}
        </motion.div>
      </div>
    </div>
  );
}