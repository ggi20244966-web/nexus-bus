// Reference Socket.io gateway. Emits the same contract as src/services/simulator.ts.
// Optional horizontal scale-out: set REDIS_URL and install `redis @socket.io/redis-adapter`
// so every gateway instance shares Pub/Sub fan-out.
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 4000);
const ROOMS = ['core-mesh', 'edge-eu', 'ops-war-room', 'pubsub-lab'];
const AUTHORS = ['aria.k', 'node-7', 'mesh-bot', 'devon', 'lumen', 'sys.relay', 'quill', 'ravi'];
const BODIES = [
  'Rebalanced shard 12 → replica-b, no dropped frames.',
  'Pub/Sub fan-out p99 dipped under 40ms after the gateway patch.',
  'Backpressure kicked in on eu-west, shedding 0.3% of presence pings.',
  'Subscribed 18k sockets to channel mesh.v2 in 1.2s.',
  'Replica lag spiked to 22ms, auto-recovered.',
];
const GATEWAYS = ['gw-01', 'gw-02', 'gw-03', 'gw-04'];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

if (process.env.REDIS_URL) {
  try {
    const { createClient } = await import('redis');
    const { createAdapter } = await import('@socket.io/redis-adapter');
    const pub = createClient({ url: process.env.REDIS_URL });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log('[nexus] Redis adapter enabled');
  } catch (e) {
    console.warn('[nexus] Redis adapter unavailable, running single node:', e.message);
  }
}

let latency = 28, pps = 1200, seq = 0;
const nodes = [
  ['redis-pri-use1', 'primary', 'us-east-1'], ['redis-rep-use1', 'replica', 'us-east-1'],
  ['redis-rep-euw1', 'replica', 'eu-west-1'], ['redis-rep-aps1', 'replica', 'ap-south-1'],
  ['sentinel-a', 'sentinel', 'us-east-1'], ['sentinel-b', 'sentinel', 'eu-west-1'],
].map(([id, role, region]) => ({ id, role, region, status: 'healthy', opsPerSec: rnd(8e3, 2e4), lagMs: rnd(1, 6), memPct: rnd(40, 62) }));

setInterval(() => {
  latency = clamp(latency + rnd(-6, 6) + (28 - latency) * 0.12, 9, 140);
  pps = clamp(pps + rnd(-220, 220) + (1200 - pps) * 0.1 + (Math.random() < 0.06 ? rnd(900, 1800) : 0), 200, 5200);
  nodes.forEach((n) => {
    n.opsPerSec = clamp(n.opsPerSec + rnd(-1800, 1800), 2e3, 4e4);
   
    n.lagMs = n.role === 'primary' ? 0 : clamp(n.lagMs + rnd(-2, 2) + (5 - n.lagMs) * 0.15, 0.5, 48);
    n.memPct = clamp(n.memPct + rnd(-1, 1), 20, 92);
    n.status = n.lagMs > 30 ? 'degraded' : 'healthy';
  });
  io.emit('telemetry:tick', {
    ts: Date.now(), wsLatencyMs: latency, p99Ms: latency * rnd(1.8, 2.6), packetsPerSec: pps,
    bytesPerSec: pps * rnd(380, 520), activeSockets: io.engine.clientsCount * 1000 + 18000,
    nodes: nodes.map((n) => ({ ...n })),
  });
}, 1000);

const emitMsg = (m) => io.emit('message:new', { id: `s-${Date.now().toString(36)}-${seq++}`, ts: Date.now(), node: pick(GATEWAYS), latencyMs: Math.round(latency), ...m });
(function loop() {
  emitMsg({ room: pick(ROOMS), author: pick(AUTHORS), body: pick(BODIES) });
  setTimeout(loop, rnd(650, 1900));
})();

io.on('connection', (socket) => {
  socket.on('room:join', (room) => ROOMS.includes(room) && socket.join(room));
  socket.on('message:send', ({ room, body }) => {
    if (!ROOMS.includes(room) || typeof body !== 'string' || !body.trim()) return;
    // NOTE: `mine` is per-sender; broadcast then flag for the origin socket.
    const msg = { id: `s-${Date.now().toString(36)}-${seq++}`, ts: Date.now(), node: pick(GATEWAYS), latencyMs: Math.round(latency), room, author: 'user-' + socket.id.slice(0, 4), body: body.slice(0, 500) };
    socket.broadcast.emit('message:new', msg);
    socket.emit('message:new', { ...msg, author: 'you', mine: true });
  });
});

httpServer.listen(PORT, () => console.log(`[nexus] gateway on :${PORT}`));