import { LayoutGroup, motion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/config/motion';

export interface Tab<T extends string> { id: T; label: string }

/** Tabs with a shared-layout glowing pill that slides along a fluid track. */
export function NavTabs<T extends string>({ tabs, value, onChange }: { tabs: Tab<T>[]; value: T; onChange: (id: T) => void }) {
  return (
    <LayoutGroup id="nav">
      <nav role="tablist" className="glass relative flex gap-1 rounded-2xl p-1">
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={clsx('relative rounded-xl px-5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-violet/70', active ? 'text-white' : 'text-violet-200/60 hover:text-white')}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={spring.track}
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-violet/35 to-accent-magenta/30 shadow-glow-violet"
                />
              )}
              {active && (
                <motion.span
                  layoutId="tab-bar"
                  transition={spring.track}
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-accent-gradient shadow-glow-magenta"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}