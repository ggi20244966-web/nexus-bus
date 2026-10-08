import { useSyncExternalStore } from 'react';
import type { ChatMessage, ConnStatus, RedisNode, TelemetryTick } from '@/types/telemetry';
import { ROOMS } from '@/config/rooms';
import { pushRing } from '@/lib/utils';

export const HISTORY = 60;
const MAX_MESSAGES = 150;

export interface TelemetryState {
  status: ConnStatus;
  activeRoom: string;
  latency: number[];
  p99: number[];
  throughput: number[];
  tick: TelemetryTick | null;
  nodes: RedisNode[];
  messages: Record<string, ChatMessage[]>;
  unread: Record<string, number>;
  totalPackets: number;
}

const zeros = () => new Array<number>(HISTORY).fill(0);
const empty = <T,>(v: () => T) => Object.fromEntries(ROOMS.map((r) => [r.id, v()])) as Record<string, T>;

let state: TelemetryState = {
  status: 'connecting',
  activeRoom: ROOMS[0].id,
  latency: zeros(),
  p99: zeros(),
  throughput: zeros(),
  tick: null,
  nodes: [],
  messages: empty<ChatMessage[]>(() => []),
  unread: empty<number>(() => 0),
  totalPackets: 0,
};

const listeners = new Set<() => void>();
const set = (patch: Partial<TelemetryState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/** Minimal external store (no extra deps) — components subscribe with selectors. */
export const telemetryStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getState: () => state,
  setStatus: (status: ConnStatus) => set({ status }),
  setActiveRoom: (activeRoom: string) => set({ activeRoom, unread: { ...state.unread, [activeRoom]: 0 } }),
  ingestTick(t: TelemetryTick) {
    set({
      tick: t,
      nodes: t.nodes,
      latency: pushRing(state.latency, t.wsLatencyMs, HISTORY),
      p99: pushRing(state.p99, t.p99Ms, HISTORY),
      throughput: pushRing(state.throughput, t.packetsPerSec, HISTORY),
      totalPackets: state.totalPackets + t.packetsPerSec,
    });
  },
  ingestMessage(m: ChatMessage) {
    const list = state.messages[m.room];
    if (!list) return;
    const isActive = state.activeRoom === m.room;
    set({
      messages: { ...state.messages, [m.room]: pushRing(list, m, MAX_MESSAGES) },
      unread: isActive || m.mine ? state.unread : { ...state.unread, [m.room]: (state.unread[m.room] ?? 0) + 1 },
    });
  },
};

export function useTelemetry<T>(selector: (s: TelemetryState) => T): T {
  return useSyncExternalStore(telemetryStore.subscribe, () => selector(state), () => selector(state));
}