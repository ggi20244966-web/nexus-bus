import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { messageIn } from '@/config/motion';
import { useTelemetry } from '@/services/telemetryStore';
import { fmtTime, hashString } from '@/lib/utils';
import type { ChatMessage } from '@/types/telemetry';

const EMPTY: ChatMessage[] = [];

function Avatar({ name }: { name: string }) {
  const h = hashString(name) % 60;
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${255 + h} 85% 62%), hsl(${315 + (h % 25)} 80% 58%))` }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function MessageStream({ roomId }: { roomId: string }) {
  const list = useTelemetry((s) => s.messages[roomId] ?? EMPTY);
  const ref = useRef<HTMLDivElement>(null);
  const visible = list.slice(-50);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [list.length]);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [roomId]);

  return (
    <div ref={ref} className="scroll-thin h-full space-y-2.5 overflow-y-auto px-4 py-4 [touch-action:pan-y]">
      {visible.length === 0 && <p className="pt-10 text-center text-sm text-violet-200/40">Listening for packets on this channel…</p>}
      <AnimatePresence initial={false}>
        {visible.map((m) => (
          <motion.div
            key={m.id}
            layout="position"
            variants={messageIn}
            initial="hidden"
            animate="show"
            className={clsx('flex gap-3 rounded-2xl p-3', m.mine ? 'ml-8 bg-gradient-to-br from-accent-violet/25 to-accent-magenta/20 ring-1 ring-white/10' : 'bg-white/[0.035]')}
          >
            <Avatar name={m.author} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
                <b className="text-[13px] text-white">{m.author}</b>
                <span className="num text-violet-200/40">{fmtTime(m.ts)}</span>
                <span className="num rounded bg-white/5 px-1.5 py-0.5 text-violet-300/70">{m.node}</span>
                <span className="num rounded bg-white/5 px-1.5 py-0.5 text-fuchsia-300/80">{m.latencyMs}ms</span>
              </div>
              <p className="mt-1 break-words text-sm leading-relaxed text-violet-50/90">{m.body}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}