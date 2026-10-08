import type { ChatMessage } from '@/types/telemetry';
import { ROOMS } from '@/config/rooms';
import { mulberry32 } from './utils';

const AUTHORS = ['aria.k', 'node-7', 'mesh-bot', 'devon', 'lumen', 'sys.relay', 'quill', 'ravi'];
const BODIES = [
  'Rebalanced shard 12 → replica-b, no dropped frames.',
  'Pub/Sub fan-out p99 dipped under 40ms after the gateway patch.',
  'Heads up: sentinel failover drill starts in 5 minutes.',
  'Backpressure kicked in on eu-west, shedding 0.3% of presence pings.',
  'Subscribed 18k sockets to channel mesh.v2 in 1.2s.',
  'Keyspace notifications look clean — expiry events batched.',
  'Sticky sessions pinned to gw-04 until drain completes.',
  'Compression ratio on binary frames now 3.4×.',
  'Replica lag spiked to 22ms, auto-recovered.',
  'New release rolled out behind a 5% canary flag.',
];
export const NODES = ['gw-01', 'gw-02', 'gw-03', 'gw-04'];

export interface ArchiveDay {
  key: string;
  label: string;
  messages: ChatMessage[];
  avgLatency: number;
  peakPackets: number;
}

/** Deterministic archive so screenshots and demos are stable. */
export function buildArchive(days = 6): ArchiveDay[] {
  const rnd = mulberry32(20261006);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, d) => {
    const base = now.getTime() - d * 86_400_000;
    const count = 7 + Math.floor(rnd() * 6);
    const messages: ChatMessage[] = Array.from({ length: count }, (_, i) => ({
      id: `a-${d}-${i}`,
      room: ROOMS[Math.floor(rnd() * ROOMS.length)].id,
      author: AUTHORS[Math.floor(rnd() * AUTHORS.length)],
      body: BODIES[Math.floor(rnd() * BODIES.length)],
      ts: base + 8 * 3_600_000 + i * Math.floor(rnd() * 1_400_000 + 200_000),
      node: NODES[Math.floor(rnd() * NODES.length)],
      latencyMs: Math.round(14 + rnd() * 46),
    }));
    return {
      key: `d${d}`,
      label: new Date(base).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' }),
      messages,
      avgLatency: Math.round(messages.reduce((s, m) => s + m.latencyMs, 0) / count),
      peakPackets: Math.round(1800 + rnd() * 2600),
    };
  });
}

export { AUTHORS, BODIES };