<div align="center">

# NEXUS//BUS

### Distributed Real-Time Communication Web Engine

A web-first dashboard for a WebSocket + Redis Pub/Sub messaging engine, with live latency, throughput and cluster health, wrapped in a 3D, WebGL-driven interface.



![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)




![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)




![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)




![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)




![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11-ec4899)




![Socket.io](https://img.shields.io/badge/Socket.io-4-white?logo=socket.io&logoColor=black)



**[Live demo](#)** · **[Screenshots](#screenshots)** · **[Architecture](#architecture)** · **[Run locally](#run-locally)**

</div>

---

## Overview

NEXUS//BUS is a front-end engine for monitoring and using a distributed real-time messaging system. It shows what happens between a user pressing **Dispatch** and every subscriber receiving the message: WebSocket latency, Redis Pub/Sub node health, and packet throughput, all updating live.

The project focuses on three things:

1. **A real-time data layer.** A typed Socket.io client with an automatic simulator fallback, and an external store that updates the UI without re-render storms.
2. **A GPU-driven visual layer.** A liquid-aurora shader that reacts to mouse velocity *and* to incoming packet bursts, plus two separate Three.js 3D scenes.
3. **Polished interaction design.** 3D tilt cards, ripple buttons with spring physics, sliding nav indicator, drag-to-swap rooms, and scroll-driven parallax.

> **Note on data:** with no gateway running, the app uses a built-in simulator that emits the same event contract as the real server. The header shows **Simulated Feed**. When a Socket.io gateway is reachable it switches to **Live · WebSocket** automatically.

## Screenshots

> Add your own images to a `docs/` folder and update the paths below.

| Overview (3D hero) | Live Rooms + Event Bus Metrics |
|---|---|
| 

![Overview](docs/overview.png)

 | 

![Live](docs/live.png)

 |

| Archive (sticky scroll) | Inspector (3D topology + drawers) |
|---|---|
| 

![Archive](docs/archive.png)

 | 

![Inspector](docs/inspector.png)

 |

## Features

**Real-time engine**
- Socket.io client with typed events (`telemetry:tick`, `message:new`, `message:send`, `room:join`)
- Automatic fallback to an in-browser simulator, and seamless swap back to live data
- Reference Node gateway with optional Redis adapter for multi-instance fan-out
- External store built on `useSyncExternalStore`, with selector hooks and ring-buffered history

**Visuals and 3D**
- Full-screen WebGL aurora shader that warps with mouse velocity and packet bursts
- Hero scene: glossy torus-knot core, orbit rings, satellites, particle halo (pulses on every packet)
- Cluster topology scene: gateway hub and six Redis nodes, with particles streaming at the live packets-per-second rate and node colours following health
- Cinematic boot intro with iris-wipe reveal (skippable, respects reduced motion)

**Interaction**
- Depth-lift glass cards: perspective tilt, cursor glare, reflection sweep
- Ripple-burst buttons with tactile spring press
- Glowing tab indicator on a fluid shared-layout track
- Horizontal room swapper (drag, arrow keys, chips) with direction-aware transitions
- 3D page-flip transitions, animated accordion drawers
- Sticky-pinned day summaries with velocity-skewed scroll in the message archive

**Observability panel**
- WebSocket latency and p99, packets/s, throughput
- Smoothly tweened 60-second charts (SVG paths interpolated by Framer Motion)
- Redis node grid: role, region, ops/s, replica lag, memory

## Tech stack

| Area | Tools |
|---|---|
| UI | React 18, TypeScript (strict), Vite |
| Styling | Tailwind CSS 3, custom glass utilities |
| Motion | Framer Motion 11, react-parallax-tilt |
| 3D / GPU | Three.js (custom GLSL fragment shader, two scenes) |
| Real-time | Socket.io client + Node gateway (optional Redis adapter) |

## Architecture

```
 Browser (React)                         Gateway (Node)              Redis
┌───────────────────────────┐          ┌───────────────┐        ┌────────────┐
│ UI components             │          │  Socket.io    │        │  Pub/Sub   │
│   ▲ useTelemetry(selector)│          │  server       │◄──────►│  adapter   │
│ telemetryStore            │◄─ events ┤               │        │  + Sentinel│
│   ▲                       │          └───────────────┘        └────────────┘
│ transport.ts ─────────────┤  live socket
│   └─ simulator.ts (fallback when no gateway)
│ signalBus ──► Aurora + 3D scenes (no React re-render)
└───────────────────────────┘
```

**Key decisions**
- **Transport fallback:** `transport.ts` tries the socket first and starts the simulator on `connect_error`. Both sides emit one shared contract, defined in `types/telemetry.ts`.
- **Imperative 3D loops:** the Three.js scenes read the store with `getState()` inside `requestAnimationFrame`, so 60 fps rendering never triggers React renders.
- **Signal bus:** network and UI events call `signalBus.burst()`. The shader listens and decays the value each frame.
- **Central motion config:** springs, page and room variants, accordion and tilt settings live in `config/motion.ts`.
- **Performance:** capped pixel ratio, pause on hidden tab, chunk-split bundle (`three`, `framer-motion`, vendor), `prefers-reduced-motion` support.

## Run locally

Requires **Node.js 18+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional, run the real gateway in a second terminal:

```bash
npm run server       # Socket.io on :4000
```

Refresh the page and the header should read **Live · WebSocket**.

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.io gateway URL |
| `VITE_FORCE_SIM` | `0` | `1` skips the network attempt and always simulates |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and produce a production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |
| `npm run server` | Start the reference Socket.io gateway |

### Scaling the gateway (optional)

```bash
npm install redis @socket.io/redis-adapter
REDIS_URL=redis://localhost:6379 npm run server
```

On Windows PowerShell use `$env:REDIS_URL="redis://localhost:6379"; npm run server`.

## Project structure

```
nexus-bus/
├── server/index.mjs               Reference Socket.io gateway
└── src/
    ├── App.tsx                    Page shell, 3D page transitions, intro
    ├── config/                    motion.ts (all animation configs), rooms.ts
    ├── types/telemetry.ts         Wire contract + domain types
    ├── lib/                       signalBus, utils, seed data
    ├── services/                  transport, simulator, telemetryStore, provider
    └── components/
        ├── intro/                 IntroSplash (boot sequence)
        ├── background/            AuroraCanvas (WebGL shader)
        ├── home/                  HomePage, HeroScene (3D)
        ├── layout/                Header, NavTabs
        ├── ui/                    GlassCard, RippleButton, Accordion, AnimatedNumber
        ├── rooms/                 ChannelList, RoomSwiper, MessageStream, Composer
        ├── metrics/               EventBusPanel, TopologyScene (3D), RedisNodeGrid, charts, MetricInspector
        └── archive/               HistoryArchive
```

## Deploy

Any static host works. On **Vercel**: import the repository, keep the detected Vite settings, and deploy. The simulator keeps the demo fully working without a backend. To use live data, host the gateway separately and set `VITE_SOCKET_URL` in the project's environment variables.

## Roadmap

- [ ] Auth and per-room permissions
- [ ] Message persistence behind the Archive view
- [ ] Tablet-first layout pass and touch gestures for the 3D scenes
- [ ] Replace simulated telemetry with a real Redis exporter

## Browser support

Current Chrome, Firefox and Safari with WebGL enabled. If WebGL is unavailable the app falls back to a CSS gradient background and the rest of the UI still works.

---

<div align="center">
Built by <strong>YOUR NAME</strong> · <a href="#">LinkedIn</a> · <a href="#">GitHub</a>
</div>