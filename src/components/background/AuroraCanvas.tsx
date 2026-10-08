import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { signalBus } from '@/lib/signalBus';
import { auroraConfig as cfg } from '@/config/motion';
import { clamp, prefersReducedMotion } from '@/lib/utils';

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2  uRes;
uniform vec2  uMouse;
uniform vec2  uVel;
uniform float uBurst;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.02 + vec2(17.1,9.2); a *= 0.5; }
  return v;
}

void main(){
  float asp = uRes.x/uRes.y;
  vec2 uv = vUv;
  vec2 p  = (uv-0.5)*vec2(asp,1.0);
  vec2 m  = (uMouse-0.5)*vec2(asp,1.0);

  // cursor lens: liquid is pushed along the pointer's velocity
  float d    = length(p-m);
  float lens = exp(-d*d*7.0);
  float spd  = length(uVel);
  p += (p-m)*lens*(0.05+spd*0.35);
  p += uVel*lens*0.28;

  float t = uTime*0.12;
  vec2 q = vec2(fbm(p*1.4+vec2(0.0,t)), fbm(p*1.4+vec2(5.2,1.3)-t));
  // packet bursts shear the whole field
  p += (q-0.5)*uBurst*0.38;
  vec2 r = vec2(fbm(p*1.6+3.0*q+vec2(1.7,9.2)+t*1.3), fbm(p*1.6+3.0*q+vec2(8.3,2.8)-t));
  float f = fbm(p*1.2+3.5*r);

  float band    = smoothstep(0.25,0.85,f)*(0.55+0.45*sin(p.y*4.0+f*6.0+t*6.0));
  float curtain = pow(max(0.0,1.0-abs(p.y+0.12-(f-0.5)*0.95)*1.7),2.0);

  vec3 base    = vec3(0.012,0.027,0.07);
  vec3 violet  = vec3(0.545,0.361,0.965);
  vec3 magenta = vec3(0.925,0.286,0.600);

  float k = clamp(f*1.25+uv.y*0.3+uBurst*0.25+lens*0.2,0.0,1.0);
  vec3 glow = mix(violet,magenta,smoothstep(0.25,0.9,k));
  float I = (band*0.5+curtain*0.6)*(0.5+uBurst*0.55);

  vec3 col = base + glow*I*0.5;
  col += magenta*lens*spd*0.18;
  col *= smoothstep(1.55,0.25,length(uv-0.5)*1.55);
  col += (hash(gl_FragCoord.xy+uTime)-0.5)*0.012;
  gl_FragColor = vec4(col,1.0);
}
`;

/**
 * Fullscreen liquid-aurora shader. Reacts to:
 *  - mouse position + smoothed velocity (lens warp)
 *  - signalBus bursts (WebSocket packets / dispatches) which decay each frame
 */
export function AuroraCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.pixelRatioCap));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uVel: { value: new THREE.Vector2(0, 0) },
      uBurst: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    // pointer tracking (target → smoothed → velocity)
    const target = new THREE.Vector2(0.5, 0.5);
    const prev = new THREE.Vector2(0.5, 0.5);
    const onMove = (e: PointerEvent) => target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    window.addEventListener('pointermove', onMove, { passive: true });

    let burst = 0;
    const off = signalBus.onBurst((i) => (burst = clamp(burst + i * 0.5, 0, cfg.burstMax)));

    const reduced = prefersReducedMotion();
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt * (reduced ? 0.25 : 1) * (cfg.baseSpeed / 0.12);

      prev.copy(uniforms.uMouse.value);
      uniforms.uMouse.value.lerp(target, cfg.mouseSmoothing);
      const vx = (uniforms.uMouse.value.x - prev.x) / Math.max(dt, 0.001);
      const vy = (uniforms.uMouse.value.y - prev.y) / Math.max(dt, 0.001);
      uniforms.uVel.value.x = clamp(uniforms.uVel.value.x * cfg.velocityDecay + vx * 0.06, -1.5, 1.5);
      uniforms.uVel.value.y = clamp(uniforms.uVel.value.y * cfg.velocityDecay + vy * 0.06, -1.5, 1.5);

      burst = Math.max(0, burst - cfg.burstDecayPerSec * dt);
      uniforms.uBurst.value += (burst - uniforms.uBurst.value) * Math.min(1, dt * 8);

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
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="fixed inset-0 -z-10 bg-space-950"
      style={failed ? { background: 'radial-gradient(60% 50% at 30% 20%, rgba(139,92,246,.35), transparent), radial-gradient(50% 45% at 75% 70%, rgba(236,72,153,.28), transparent), #030712' } : undefined}
    />
  );
}