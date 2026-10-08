import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { telemetryStore } from '@/services/telemetryStore';
import { prefersReducedMotion } from '@/lib/utils';

const STATUS_COLOR = { healthy: 0x8b5cf6, degraded: 0xfbbf24, down: 0xfb7185 } as const;
const NODE_COUNT = 6;
const RADIUS = 3;
const PARTICLES = 120;

/**
 * Real-time 3D cluster topology: a magenta gateway hub, six Redis nodes on an orbit ring,
 * and packet particles streaming hub → node at a rate driven by live packets/s.
 * Reads the store imperatively inside the render loop — zero React re-renders.
 */
export function TopologyScene({ height = 260 }: { height?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; // WebGL unavailable: the card just shows its glass background
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 2.6, 8.2);
    camera.lookAt(0, 0, 0);

    const root = new THREE.Group();
    scene.add(root);

    // --- hub -----------------------------------------------------------------
    const hub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95, 1),
      new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true, transparent: true, opacity: 0.9 }),
    );
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    root.add(hub, core, halo);

    // --- orbit ring + floor grid ----------------------------------------------
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(RADIUS, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    root.add(ring);

    const grid = new THREE.GridHelper(16, 16, 0x8b5cf6, 0x18214a);
    grid.position.y = -2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    scene.add(grid);

    // --- nodes + links ----------------------------------------------------------
    const nodePos: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGlows: THREE.Mesh[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const a = (i / NODE_COUNT) * Math.PI * 2;
      const p = new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(i * 1.7) * 0.55, Math.sin(a) * RADIUS);
      nodePos.push(p);

      const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshBasicMaterial({ color: STATUS_COLOR.healthy }));
      m.position.copy(p);
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 24),
        new THREE.MeshBasicMaterial({ color: STATUS_COLOR.healthy, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      g.position.copy(p);
      root.add(m, g);
      nodeMeshes.push(m);
      nodeGlows.push(g);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p]),
        new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4 }),
      );
      root.add(line);
    }

    // --- packet particles ---------------------------------------------------------
    const pPos = new Float32Array(PARTICLES * 3);
    const pT = new Float32Array(PARTICLES);
    const pNode = new Uint8Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      pT[i] = Math.random();
      pNode[i] = i % NODE_COUNT;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xf472b6, size: 0.11, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    root.add(particles);

    // --- star dust ---------------------------------------------------------------------
    const dust = new Float32Array(240 * 3);
    for (let i = 0; i < dust.length; i++) dust[i] = (Math.random() - 0.5) * 18;
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.03, transparent: true, opacity: 0.6 })));

    // --- sizing + pointer parallax -----------------------------------------------------------
    const resize = () => {
      const w = el.clientWidth || 300;
      const h = el.clientHeight || height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.7;
      tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 1.1;
    };
    const onLeave = () => ((tilt.tx = 0), (tilt.ty = 0));
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    // --- loop -------------------------------------------------------------------------------------
    const reduced = prefersReducedMotion();
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    let raf = 0;
    let running = true;

    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const s = telemetryStore.getState();
      const pps = s.tick?.packetsPerSec ?? 1200;
      const speed = (0.25 + pps / 2600) * (reduced ? 0.2 : 1);

      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;
      root.rotation.y += dt * 0.22 * (reduced ? 0.2 : 1);
      root.rotation.x = tilt.x;
      camera.position.x += (tilt.y * 2.2 - camera.position.x) * 0.05;
      camera.lookAt(0, 0, 0);

      hub.rotation.x += dt * 0.5;
      hub.rotation.y -= dt * 0.8;
      const pulse = 1 + Math.sin(t * 3) * 0.06 + Math.min(0.25, pps / 20000);
      core.scale.setScalar(pulse);
      halo.scale.setScalar(1 + Math.sin(t * 2) * 0.08 + Math.min(0.3, pps / 15000));

      for (let i = 0; i < NODE_COUNT; i++) {
        const n = s.nodes[i];
        const color = STATUS_COLOR[n?.status ?? 'healthy'];
        (nodeMeshes[i].material as THREE.MeshBasicMaterial).color.setHex(color);
        (nodeGlows[i].material as THREE.MeshBasicMaterial).color.setHex(color);
        const load = n ? Math.min(1, n.opsPerSec / 40000) : 0.3;
        nodeGlows[i].scale.setScalar(0.9 + load * 0.9 + Math.sin(t * 2 + i) * 0.06);
        nodeMeshes[i].position.y = nodePos[i].y + Math.sin(t * 1.2 + i * 1.3) * 0.12;
        nodeGlows[i].position.y = nodeMeshes[i].position.y;
      }

      for (let i = 0; i < PARTICLES; i++) {
        pT[i] += dt * speed;
        if (pT[i] >= 1) {
          pT[i] = 0;
          pNode[i] = (Math.random() * NODE_COUNT) | 0;
        }
        tmp.copy(nodePos[pNode[i]]).multiplyScalar(pT[i]);
        pPos[i * 3] = tmp.x;
        pPos[i * 3 + 1] = tmp.y;
        pPos[i * 3 + 2] = tmp.z;
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    frame();

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        clock.getDelta();
        frame();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [height]);

  return <div ref={host} role="img" aria-label="3D topology of the gateway hub and Redis nodes" style={{ height }} className="w-full cursor-grab" />;
}