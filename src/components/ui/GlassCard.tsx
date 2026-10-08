import type { CSSProperties, ReactNode } from 'react';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { spring, tiltConfig } from '@/config/motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** enable 3D tilt + glare + hover lift */
  interactive?: boolean;
  /** gradient ring highlight (e.g. selected channel) */
  active?: boolean;
  maxTilt?: number;
  onClick?: () => void;
  radius?: number;
}

/**
 * Depth-lift glass card: perspective tilt (react-parallax-tilt), cursor glare,
 * a diagonal reflection sweep and a spring lift. Wrap children in <Depth z={n}> to float them.
 */
export function GlassCard({ children, className, interactive = true, active = false, maxTilt = tiltConfig.maxAngle, onClick, radius = 20 }: GlassCardProps) {
  const style: CSSProperties = { borderRadius: radius };
  return (
    <Tilt
      tiltEnable={interactive}
      tiltMaxAngleX={maxTilt}
      tiltMaxAngleY={maxTilt}
      perspective={tiltConfig.perspective}
      scale={interactive ? tiltConfig.scale : 1}
      transitionSpeed={tiltConfig.transitionSpeed}
      glareEnable={interactive}
      glareMaxOpacity={tiltConfig.glareMaxOpacity}
      glareColor={tiltConfig.glareColor}
      glareBorderRadius={`${radius}px`}
      style={{ transformStyle: 'preserve-3d' }}
      className={clsx('h-full', className)}
    >
      <motion.div
        onClick={onClick}
        whileHover={interactive ? { y: -3 } : undefined}
        whileTap={onClick ? { scale: 0.985 } : undefined}
        transition={spring.snappy}
        style={style}
        className={clsx('glass group relative h-full', onClick && 'cursor-pointer', active && 'glass-active shadow-glow-violet')}
      >
        <span className="glass-sweep" />
        {children}
      </motion.div>
    </Tilt>
  );
}

/** Pops its children toward the viewer inside a tilting card. */
export function Depth({ z = 24, children, className }: { z?: number; children: ReactNode; className?: string }) {
  return (
    <div className={className} style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}