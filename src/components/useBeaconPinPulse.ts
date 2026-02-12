import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

type GlobeRef = MutableRefObject<any>;

type GlowEntry = {
  mesh: THREE.Mesh;
  phase: number;
  baseOpacity: number;
};

export function useBeaconPinPulse(globeEl: GlobeRef) {
  const glowsRef = useRef<GlowEntry[]>([]);
  const lastRefreshRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const refreshGlows = () => {
      const scene = globeEl.current?.scene?.();
      if (!scene) return;

      const next: GlowEntry[] = [];
      scene.traverse((obj: any) => {
        if (!obj?.userData?.beaconPinGlow) return;
        if (!(obj instanceof THREE.Mesh)) return;
        const mat: any = obj.material;
        const baseOpacity = typeof obj.userData.baseOpacity === 'number' ? obj.userData.baseOpacity : (typeof mat?.opacity === 'number' ? mat.opacity : 0.22);
        const phase = typeof obj.userData.pulsePhase === 'number' ? obj.userData.pulsePhase : 0;
        next.push({ mesh: obj, phase, baseOpacity });
      });

      glowsRef.current = next;
    };

    const tick = () => {
      if (isCancelled) return;

      const now = performance.now();
      if (now - lastRefreshRef.current > 1000) {
        lastRefreshRef.current = now;
        refreshGlows();
      }

      const t = now * 0.0022; // speed
      const glows = glowsRef.current;
      for (let i = 0; i < glows.length; i++) {
        const { mesh, phase, baseOpacity } = glows[i];
        const pulse = 0.5 + 0.5 * Math.sin(t + phase);

        // Scale pulse: subtle but noticeable "clickable" vibe.
        const scale = 0.92 + pulse * 0.28; // 0.92..1.20
        mesh.scale.setScalar(scale);

        // Opacity pulse: keeps additive glow alive.
        const mat: any = mesh.material;
        if (mat && typeof mat.opacity === 'number') {
          mat.opacity = baseOpacity * (0.75 + pulse * 0.55); // ~0.75..1.30 of base
          mat.needsUpdate = false;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Initial populate + start loop.
    refreshGlows();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [globeEl]);
}
