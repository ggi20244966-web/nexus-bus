import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { signalBus } from '@/lib/signalBus';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Hero 3D scene: glossy torus-knot core, wireframe shell, three tilted orbit rings with
 * satellites, and a particle halo. Pulses on every packet burst, parallaxes with the pointer.
 */
export function HeroScene({ height = 520 }: { height?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; // no WebGL: the CSS glow behind the canvas remains
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    scene.add(new THREE.AmbientLight(0x6d5bd0, 0.8));
    const l1 = new THREE.PointLight(0xec4899, 70, 22);
    l1.position.set(4, 3, 4);
    const l2 = new THREE.PointLight(0x8b5cf6, 70, 22);
    l2.position.set(-4, -2, 3);
    scene.add(l1, l2);

    const group = new THREE.Group();
    scene.add(group);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      metalness: 0.55,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x2a1170,
      emissiveIntensity: 0.8,
    });
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.34, 240, 36, 2, 3), coreMat);
    const wire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.15, 0.37, 120, 16, 2, 3),
      new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true, transparent: true, opacity: 0.18 }),
    );
    group.add(knot, wire);

    // orbit rings with spinning satellites
    const orbits = [2.1, 2.7, 3.3].map((r, i) => {
      const tilt = new THREE.Group();
      tilt.rotation.set((Math.PI / 2.4) * (i + 1), i * 0.7, 0);
      const spin = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.008, 8, 200),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xec4899 : 0x8b5cf6, transparent: true, opacity: 0.5 }),
      );
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sat.position.set(r, 0, 0);
      spin.add(sat);
      tilt.add(ring, spin);
      scene.add(tilt);
      return { spin, speed: 0.5 + i * 0.25 };
    });

    // particle halo
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 4 + Math.random() * 3;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const halo = new THREE.Points(
      haloGeo,
      new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    scene.add(halo);

    const resize = () => {
      const w = el.clientWidth || 400;
      const h = el.clientHeight || height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let pulse = 0;
    const off = signalBus.onBurst((i) => (pulse = Math.min(1, pulse + i * 0.4)));

    const reduced = prefersReducedMotion();
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const k = reduced ? 0.2 : 1;

      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;

      group.rotation.y += dt * 0.3 * k;
      group.rotation.x = Math.sin(t * 0.4) * 0.15 + ptr.y * 0.35;
      group.rotation.z = ptr.x * -0.2;
      wire.rotation.y -= dt * 0.15 * k;
      halo.rotation.y += dt * 0.03 * k;
      orbits.forEach((o) => (o.spin.rotation.z += dt * o.speed * k));

      pulse = Math.max(0, pulse - dt * 1.5);
      const s = 1 + pulse * 0.12 + Math.sin(t * 2) * 0.01;
      knot.scale.setScalar(s);
      coreMat.emissiveIntensity = 0.8 + pulse * 1.4;

      camera.position.x += (ptr.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-ptr.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

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
      off();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
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

  return <div ref={host} role="img" aria-label="Animated 3D network core" style={{ height }} className="w-full" />;
}