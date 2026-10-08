import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createTransport, type Transport } from './transport';
import { telemetryStore } from './telemetryStore';
import { signalBus } from '@/lib/signalBus';

const noop: Transport = { send: () => {}, join: () => {}, close: () => {} };
const Ctx = createContext<Transport>(noop);
export const useTransport = () => useContext(Ctx);

export function TransportProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Transport>(noop);
  // stable facade so consumers never re-render when the underlying transport is recreated (StrictMode)
  const facade = useMemo<Transport>(
    () => ({
      send: (r, b) => {
        signalBus.burst(1.1);
        ref.current.send(r, b);
      },
      join: (r) => ref.current.join(r),
      close: () => ref.current.close(),
    }),
    [],
  );

  useEffect(() => {
    ref.current = createTransport({
      onStatus: telemetryStore.setStatus,
      onTick: (t) => {
        telemetryStore.ingestTick(t);
        signalBus.burst(Math.min(0.7, t.packetsPerSec / 6000));
      },
      onMessage: (m) => {
        telemetryStore.ingestMessage(m);
        signalBus.burst(m.mine ? 0.9 : 0.45);
      },
    });
    return () => {
      ref.current.close();
      ref.current = noop;
    };
  }, []);

  return <Ctx.Provider value={facade}>{children}</Ctx.Provider>;
}