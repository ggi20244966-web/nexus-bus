import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import clsx from 'clsx';
import { ROOMS } from '@/config/rooms';
import { roomSwipe, spring } from '@/config/motion';
import { telemetryStore, useTelemetry } from '@/services/telemetryStore';
import { useTransport } from '@/services/TransportProvider';
import { MessageStream } from './MessageStream';
import { Composer } from './Composer';
import { GlassCard } from '@/components/ui/GlassCard';

/** Horizontal room swapper: drag, arrow keys, or chips. Direction-aware enter/exit. */
export function RoomSwiper() {
  const active = useTelemetry((s) => s.activeRoom);
  const transport = useTransport();
  const idx = Math.max(0, ROOMS.findIndex((r) => r.id === active));
  const prevIdx = useRef(idx);
  const dir = idx >= prevIdx.current ? 1 : -1;
  useEffect(() => {
    prevIdx.current = idx;
  }, [idx]);

  const go = useCallback(
    (i: number) => {
      const n = (i + ROOMS.length) % ROOMS.length;
      telemetryStore.setActiveRoom(ROOMS[n].id);
      transport.join(ROOMS[n].id);
    },
    [transport],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, idx]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -90 || info.velocity.x < -520) go(idx + 1);
    else if (info.offset.x > 90 || info.velocity.x > 520) go(idx - 1);
  };

  return (
    <GlassCard interactive={false} radius={24} className="flex min-h-[560px] flex-col">
      <div className="flex h-[calc(100vh-170px)] min-h-[560px] flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="scroll-thin flex flex-1 gap-1.5 overflow-x-auto">
            {ROOMS.map((r, i) => (
              <button key={r.id} onClick={() => go(i)} className={clsx('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium outline-none transition-colors', i === idx ? 'text-white' : 'text-violet-200/50 hover:text-white')}>
                {i === idx && <motion.span layoutId="room-chip" transition={spring.track} className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-accent-violet/50" />}
                <span className="relative">#{r.name}</span>
              </button>
            ))}
          </div>
          <span className="num hidden text-[11px] text-violet-200/40 sm:inline">← drag / arrows →</span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={active}
              custom={dir}
              variants={roomSwipe}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.22}
              onDragEnd={onDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <MessageStream roomId={active} />
            </motion.div>
          </AnimatePresence>
        </div>
        <Composer />
      </div>
    </GlassCard>
  );
}