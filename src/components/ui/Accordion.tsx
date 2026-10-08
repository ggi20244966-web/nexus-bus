import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { accordion, spring } from '@/config/motion';

interface ItemProps {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Animated accordion drawer (height auto + chevron spin + glowing header edge). */
export function AccordionItem({ title, subtitle, badge, open, onToggle, children }: ItemProps) {
  return (
    <div className={clsx('glass relative overflow-hidden rounded-2xl transition-shadow duration-500', open && 'shadow-glow-violet')}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none focus-visible:bg-white/5"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={spring.snappy}
          className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-violet-300"
        >
          ›
        </motion.span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-white">{title}</span>
          {subtitle && <span className="block text-xs text-violet-200/50">{subtitle}</span>}
        </span>
        {badge}
      </button>
      <motion.span
        aria-hidden
        animate={{ scaleX: open ? 1 : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ originX: 0 }}
        className="absolute inset-x-0 top-0 h-px bg-accent-gradient"
      />
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content" {...accordion} className="overflow-hidden">
            <div className="border-t border-white/5 px-5 pb-5 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}