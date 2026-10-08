import type { Room } from '@/types/telemetry';

export const ROOMS: Room[] = [
  { id: 'core-mesh', name: 'core-mesh', topic: 'Primary fan-out channel', accent: 'violet' },
  { id: 'edge-eu', name: 'edge-eu', topic: 'Frankfurt / Dublin edge gateways', accent: 'magenta' },
  { id: 'ops-war-room', name: 'ops-war-room', topic: 'Incident coordination', accent: 'violet' },
  { id: 'pubsub-lab', name: 'pubsub-lab', topic: 'Redis keyspace experiments', accent: 'magenta' },
];