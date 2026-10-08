type Listener = (intensity: number) => void;
const listeners = new Set<Listener>();

/** Tiny pub/sub that lets network + UI events kick the WebGL aurora without React re-renders. */
export const signalBus = {
  onBurst(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  burst(intensity = 0.5) {
    listeners.forEach((fn) => fn(intensity));
  },
};