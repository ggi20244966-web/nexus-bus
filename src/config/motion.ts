import type { Transition, Variants } from 'framer-motion';

/** Central animation config — every component pulls springs / variants from here. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const spring = {
  soft: { type: 'spring', stiffness: 180, damping: 24, mass: 0.9 } as Transition,
  snappy: { type: 'spring', stiffness: 420, damping: 30 } as Transition,
  /** tactile micro-bounce for presses */
  bounce: { type: 'spring', stiffness: 650, damping: 14, mass: 0.7 } as Transition,
  /** fluid slide track for nav indicator */
  track: { type: 'spring', stiffness: 380, damping: 34 } as Transition,
};

/** Page swap: 3D perspective flip + slide, direction aware (custom = ±1). */
export const pageSwap: Variants = {
  enter: (d: number) => ({ x: d * 120, rotateY: d * -14, scale: 0.96, opacity: 0, transformPerspective: 1400 }),
  center: { x: 0, rotateY: 0, scale: 1, opacity: 1, transformPerspective: 1400, transition: { duration: 0.7, ease: EASE_OUT } },
  exit: (d: number) => ({ x: d * -120, rotateY: d * 14, scale: 0.96, opacity: 0, transformPerspective: 1400, transition: { duration: 0.4, ease: EASE_IN_OUT } }),
};

/** Room swipe: tighter travel, no blur (keeps text crisp while dragging). */
export const roomSwipe: Variants = {
  enter: (d: number) => ({ x: `${d * 38}%`, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { ...spring.soft } },
  exit: (d: number) => ({ x: `${d * -38}%`, opacity: 0, scale: 0.97, transition: { duration: 0.28, ease: EASE_IN_OUT } }),
};

export const messageIn: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...spring.soft } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const accordion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { height: { duration: 0.42, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 0.08 } } },
  exit: { height: 0, opacity: 0, transition: { height: { duration: 0.3, ease: EASE_IN_OUT }, opacity: { duration: 0.15 } } },
};

/** Props forwarded to react-parallax-tilt */
export const tiltConfig = {
  perspective: 900,
  scale: 1.02,
  transitionSpeed: 900,
  glareMaxOpacity: 0.16,
  glareColor: '#c4b5fd',
  maxAngle: 7,
};

/** Aurora shader tuning knobs. */
export const auroraConfig = {
  pixelRatioCap: 1.25,
  baseSpeed: 0.12,
  burstDecayPerSec: 1.6,
  burstMax: 1.4,
  mouseSmoothing: 0.08,
  velocityDecay: 0.9,
};