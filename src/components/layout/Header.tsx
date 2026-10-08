import { motion } from 'framer-motion';
import { NavTabs, type Tab } from './NavTabs';
import { useTelemetry } from '@/services/telemetryStore';
import type { ConnStatus } from '@/types/telemetry';

export type View = 'home' | 'live' | 'archive' | 'inspector';
export const TABS: Tab<View>[] = [
  { id: 'home', label: 'Overview' },
  { id: 'live', label: 'Live Rooms' },
  { id: 'archive', label: 'Archive' },
  { id: 'inspector', label: 'Inspector' },
];

const STATUS: Record<ConnStatus, { label: string; color: string }> = {
  connecting: { label: 'Connecting', color: '#fbbf24' },
  live: { label: 'Live · WebSocket', color: '#34d399' },
  simulated: { label: 'Simulated Feed', color: '#a78bfa' },
  offline: { label: 'Offline', color: '#fb7185' },
};

export function Header({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const status = useTelemetry((s) => s.status);
  const sockets = useTelemetry((s) => s.tick?.activeSockets ?? 0);
  const st = STATUS[status];
  return (
    <header className="mx-auto flex w-full max-w-[1640px] flex-wrap items-center gap-4 px-5 pt-5 md:px-8">
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#EC4899" /></linearGradient>
          </defs>
          <path d="M16 2l12 7v14l-12 7L4 23V9z" fill="url(#lg)" />
          <path d="M16 9l6 3.5v7L16 23l-6-3.5v-7z" fill="#030712" opacity=".85" />
          <circle cx="16" cy="16" r="2.4" fill="#fff" />
        </svg>
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight">NEXUS<span className="text-gradient">//BUS</span></h1>
          <p className="hidden text-[11px] text-violet-200/50 sm:block">Distributed Real-Time Communication Engine</p>
        </div>
      </motion.div>

      <div className="mx-auto"><NavTabs tabs={TABS} value={view} onChange={onChange} /></div>

      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2 text-xs">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: st.color }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: st.color }} />
        </span>
        <span className="font-medium text-white">{st.label}</span>
        <span className="num hidden text-violet-200/50 md:inline">{sockets.toLocaleString()} sockets</span>
      </div>
    </header>
  );
}