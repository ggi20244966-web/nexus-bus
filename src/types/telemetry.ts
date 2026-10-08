export type NodeStatus = 'healthy' | 'degraded' | 'down';
export type NodeRole = 'primary' | 'replica' | 'sentinel';

export interface RedisNode {
  id: string;
  role: NodeRole;
  region: string;
  status: NodeStatus;
  opsPerSec: number;
  lagMs: number;
  memPct: number;
}

export interface TelemetryTick {
  ts: number;
  wsLatencyMs: number;
  p99Ms: number;
  packetsPerSec: number;
  bytesPerSec: number;
  activeSockets: number;
  nodes: RedisNode[];
}

export interface ChatMessage {
  id: string;
  room: string;
  author: string;
  body: string;
  ts: number;
  node: string;
  latencyMs: number;
  mine?: boolean;
}

export interface Room {
  id: string;
  name: string;
  topic: string;
  accent: 'violet' | 'magenta';
}

/** Wire contract shared by the browser client and server/index.mjs */
export interface ServerToClientEvents {
  'telemetry:tick': (tick: TelemetryTick) => void;
  'message:new': (message: ChatMessage) => void;
}
export interface ClientToServerEvents {
  'message:send': (payload: { room: string; body: string }) => void;
  'room:join': (room: string) => void;
}

export type ConnStatus = 'connecting' | 'live' | 'simulated' | 'offline';