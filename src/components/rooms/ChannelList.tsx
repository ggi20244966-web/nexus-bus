import { motion } from 'framer-motion';
import { ROOMS } from '@/config/rooms';
import { staggerParent, riseIn } from '@/config/motion';
import { telemetryStore, useTelemetry } from '@/services/telemetryStore';
import { Depth, GlassCard } from '@/components/ui/GlassCard';
import { useTransport } from '@/services/TransportProvider';

export function ChannelList() {
  const active = useTelemetry((s) => s.activeRoom);
  const unread = useTelemetry((s) => s.unread);
  const messages = useTelemetry((s) => s.messages);
  const transport = useTransport();

  return (
    <motion.ul
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="scroll-thin flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {ROOMS.map((r) => {
        const last = messages[r.id]?.at(-1);
        const n = unread[r.id] ?? 0;
        return (
          <motion.li key={r.id} variants={riseIn} className="min-w-[220px] lg:min-w-0">
            <GlassCard
              active={active === r.id}
              onClick={() => {
                telemetryStore.setActiveRoom(r.id);
                transport.join(r.id);
              }}
              radius={18}
            >
              <div className="p-4">
                <Depth z={22} className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-white"><span className="text-gradient">#</span> {r.name}</span>
                  {n > 0 && (
                    <motion.span key={n} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="num rounded-full bg-accent-gradient px-2 py-0.5 text-[11px] font-semibold text-white shadow-glow-magenta">
                      {n > 99 ? '99+' : n}
                    </motion.span>
                  )}
                </Depth>
                <Depth z={10}>
                  <p className="mt-1 text-xs text-violet-200/50">{r.topic}</p>
                  <p className="mt-3 line-clamp-2 min-h-[2.4em] text-xs text-violet-100/70">
                    {last ? <><b className="text-violet-200">{last.author}</b> {last.body}</> : 'Waiting for packets…'}
                  </p>
                </Depth>
              </div>
            </GlassCard>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}