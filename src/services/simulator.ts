import type { ChatMessage, RedisNode, TelemetryTick } from '@/types/telemetry';
import { ROOMS } from '@/config/rooms';
import { AUTHORS, BODIES, NODES } from '@/lib/seed';
import { clamp } from '@/lib/utils';

export interface SimHandlers {
  onTick: (t: TelemetryTick) => void;
  onMessage: (m: ChatMessage) => void;
}

const NODE_SEED: Omit<RedisNode, 'opsPerSec' | 'lagMs' | 'memPct' | 'status'>[] = [
  { id: 'redis-pri-use1', role: 'primary', region: 'us-east-1' },
  { id: 'redis-rep-use1', role: 'replica', region: 'us-east-1' },
  { id: 'redis-rep-euw1', role: 'replica', region: 'eu-west-1' },
  { id: 'redis-rep-aps1', role: 'replica', region: 'ap-south-1' },
  { id: 'sentinel-a', role: 'sentinel', region: 'us-east-1' },
  { id: 'sentinel-b', role: 'sentinel', region: 'eu-west-1' },
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
let seq = 0;
export const makeId = () => `m-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Offline engine: produces the same event contract the real Socket.io gateway emits. */
export function startSimulator(h: SimHandlers) {
  let latency = 28;
  let pps = 1200;
  let sockets = 18_400;
  const nodes: RedisNode[] = NODE_SEED.map((n) => ({
    ...n,
    status: 'healthy',
    opsPerSec: rnd(8_000, 22_000),
    lagMs: rnd(1, 6),
    memPct: rnd(38, 64),
  }));

  const tick = () => {
    latency = clamp(latency + rnd(-6, 6) + (28 - latency) * 0.12, 9, 140);
    if (Math.random() < 0.06) pps += rnd(900, 1800); // packet burst
    pps = clamp(pps + rnd(-220, 220) + (1200 - pps) * 0.1, 200, 5200);
    sockets = clamp(sockets + rnd(-90, 90), 12_000, 30_000);
    nodes.forEach((n) => {
      n.opsPerSec = clamp(n.opsPerSec + rnd(-1800, 1800), 2_000, 40_000);
      
      n.lagMs = n.role === 'primary' ? 0 : clamp(n.lagMs + rnd(-2, 2) + (5 - n.lagMs) * 0.15, 0.5, 48);
      n.memPct = clamp(n.memPct + rnd(-1, 1), 20, 92);
      const r = Math.random();
      n.status = n.lagMs > 30 || r < 0.015 ? 'degraded' : r > 0.997 ? 'down' : 'healthy';
    });
    h.onTick({
      ts: Date.now(),
      wsLatencyMs: latency,
      p99Ms: latency * rnd(1.8, 2.6),
      packetsPerSec: pps,
      bytesPerSec: pps * rnd(380, 520),
      activeSockets: Math.round(sockets),
      nodes: nodes.map((n) => ({ ...n })),
    });
  };

  const emitRandomMessage = () => {
    h.onMessage({
      id: makeId(),
      room: ROOMS[Math.floor(Math.random() * ROOMS.length)].id,
      author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
      body: BODIES[Math.floor(Math.random() * BODIES.length)],
      ts: Date.now(),
      node: NODES[Math.floor(Math.random() * NODES.length)],
      latencyMs: Math.round(latency + rnd(-4, 8)),
    });
  };

  let msgTimer: ReturnType<typeof setTimeout>;
  const loop = () => {
    emitRandomMessage();
    msgTimer = setTimeout(loop, rnd(650, 1900));
  };

  tick();
  const tickTimer = setInterval(tick, 1000);
  msgTimer = setTimeout(loop, 600);

  return {
    send(room: string, body: string) {
      setTimeout(() => {
        h.onMessage({
          id: makeId(), room, author: 'you', body, ts: Date.now(),
          node: NODES[Math.floor(Math.random() * NODES.length)],
          latencyMs: Math.round(latency), mine: true,
        });
      }, latency);
    },
    stop() {
      clearInterval(tickTimer);
      clearTimeout(msgTimer);
    },
  };
}