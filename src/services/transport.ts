import { io, type Socket } from 'socket.io-client';
import type { ChatMessage, ClientToServerEvents, ConnStatus, ServerToClientEvents, TelemetryTick } from '@/types/telemetry';
import { startSimulator } from './simulator';

export interface TransportHandlers {
  onStatus: (s: ConnStatus) => void;
  onTick: (t: TelemetryTick) => void;
  onMessage: (m: ChatMessage) => void;
}

export interface Transport {
  send: (room: string, body: string) => void;
  join: (room: string) => void;
  close: () => void;
}

/**
 * Socket.io-first transport. If the gateway is unreachable we transparently switch to the
 * in-browser simulator (same event contract) so the dashboard is always demo-able, and swap
 * back to live data the moment the socket connects.
 */
export function createTransport(h: TransportHandlers): Transport {
  const url = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
  const forceSim = import.meta.env.VITE_FORCE_SIM === '1';
  let sim: ReturnType<typeof startSimulator> | null = null;
  let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  const beginSim = () => {
    if (sim) return;
    sim = startSimulator({ onTick: h.onTick, onMessage: h.onMessage });
    h.onStatus('simulated');
  };

  h.onStatus('connecting');

  if (forceSim) {
    beginSim();
  } else {
    socket = io(url, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 900,
      timeout: 2500,
    });
    socket.on('connect', () => {
      sim?.stop();
      sim = null;
      h.onStatus('live');
    });
    socket.on('connect_error', beginSim);
    socket.on('disconnect', () => (socket?.active ? h.onStatus('connecting') : beginSim()));
    socket.on('telemetry:tick', h.onTick);
    socket.on('message:new', h.onMessage);
  }

  return {
    send: (room, body) => (sim ? sim.send(room, body) : socket?.emit('message:send', { room, body })),
    join: (room) => socket?.emit('room:join', room),
    close: () => {
      sim?.stop();
      sim = null;
      socket?.close();
    },
  };
}