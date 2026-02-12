import React, { useMemo, useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { PublicationVenueLocation } from '../types';
import './GlobeMarkers.css';
import { createBeaconPin } from './globeBeaconPin';
import { useBeaconPinPulse } from './useBeaconPinPulse.ts';
import { resolveImagePath } from '../utils/resolveImagePath';

interface ResearchGlobeProps {
  data: PublicationVenueLocation[];
  onLocationClick: (location: PublicationVenueLocation) => void;
}

const ResearchGlobe: React.FC<ResearchGlobeProps> = ({ data, onLocationClick }) => {
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 800 });
  const isHoveringPointRef = useRef(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useBeaconPinPulse(globeEl);

  // react-globe.gl runtime prop is `objectFacesSurface` (singular). The distributed .d.ts currently
  // exposes `objectFacesSurfaces`, so we spread an `any` typed object to keep both TS + runtime happy.
  const objectFacesSurfaceProps = useMemo(() => ({ objectFacesSurface: true }) as any, []);

  const POINTER_HEX = '#ff5f1b';
  // Aesthetic warm yellow (not pure/blunt #FFFF00)
  const ARC_YELLOW = 'rgba(248, 214, 106, 0.65)';
  const ARC_YELLOW_FADE = 'rgba(248, 214, 106, 0.08)';
  const RING_ORANGE = 'rgba(255, 103, 27, 0.42)';
  const RING_ORANGE_FADE = 'rgba(255, 103, 27, 0.12)';

  const getPointKey = (d: any) => {
    const lat = typeof d?.lat === 'number' ? d.lat.toFixed(4) : String(d?.lat ?? '');
    const lng = typeof d?.lng === 'number' ? d.lng.toFixed(4) : String(d?.lng ?? '');
    return `${lat},${lng}`;
  };

  const setCanvasCursor = (cursor: string) => {
    const el = globeEl.current?.renderer?.()?.domElement as HTMLElement | undefined;
    if (el) el.style.cursor = cursor;
  };

  type PopoverPos = { x: number; y: number };
  const lastPointerPosRef = useRef<PopoverPos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<PublicationVenueLocation | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);

  const updatePointerPos = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastPointerPosRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const hoverTitle = useMemo(() => {
    if (!hovered) return '';
    return [hovered.city, hovered.country].map((s) => (s ?? '').toString().trim()).filter(Boolean).join(', ') || 'Location';
  }, [hovered]);

  const hoverSubtitle = useMemo(() => {
    if (!hovered) return '';
    const conferences = Array.isArray(hovered.conferences) ? hovered.conferences : [];
    const conferenceCount = conferences.length;
    const paperCount = conferences.reduce(
      (sum: number, c: any) => sum + (Array.isArray(c?.papers) ? c.papers.length : 0),
      0
    );
    return conferenceCount
      ? `${conferenceCount} conference${conferenceCount === 1 ? '' : 's'} • ${paperCount} paper${paperCount === 1 ? '' : 's'}`
      : '';
  }, [hovered]);

  // Resize globe based on container, not window magic numbers
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();

      setSize({
        width: Math.floor(width),
        height: Math.floor(height)
      });
    };

    updateSize();

    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  // Camera + controls setup
  useEffect(() => {
    if (!globeEl.current) return;

    const controls = globeEl.current.controls();

    // Start the globe focused on India, then begin auto-rotation.
    globeEl.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.2 }, 0);

    const stop = () => (controls.autoRotate = false);
    const start = () => {
      if (!isHoveringPointRef.current) controls.autoRotate = true;
    };

    controls.addEventListener('start', stop);
    controls.addEventListener('end', start);

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    return () => {
      controls.removeEventListener('start', stop);
      controls.removeEventListener('end', start);
    };
  }, []);


  // Optional arcs
  const arcsData = data.slice(0, -1).map((d, i) => ({
    startLat: d.lat,
    startLng: d.lng,
    endLat: data[i + 1].lat,
    endLng: data[i + 1].lng
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        position: 'relative'
      }}
      onMouseMove={(e) => {
        updatePointerPos(e.clientX, e.clientY);
        if (hovered) setPopoverPos(lastPointerPosRef.current);
      }}
    >
      <Globe
        ref={globeEl}
        width={size.width}
        height={size.height}

        globeImageUrl={resolveImagePath("assets/images/globe2.jpg")}
        bumpImageUrl={"//unpkg.com/three-globe/example/img/earth-topology.png"}
        backgroundColor="rgba(0,0,0,0)"

        objectsData={data}
        objectLat={(d: any) => d.lat}
        objectLng={(d: any) => d.lng}
        objectAltitude={() => 0}
        objectRotation={() => ({ x: 26, z: -10 })}
        objectThreeObject={() => createBeaconPin(POINTER_HEX)}
        {...objectFacesSurfaceProps}
        onObjectHover={(p: any) => {
          isHoveringPointRef.current = Boolean(p);
          const controls = globeEl.current?.controls?.();
          if (!controls) return;
          controls.autoRotate = !isHoveringPointRef.current;

          setHovered(p ?? null);
          const key = p ? getPointKey(p) : null;
          setHoveredKey(key);
          setPopoverPos(p ? lastPointerPosRef.current : null);
          setCanvasCursor(p ? 'pointer' : 'grab');
        }}
        onObjectClick={(p: any) => onLocationClick(p)}

        ringsData={data}
        ringLat={(d: any) => d.lat}
        ringLng={(d: any) => d.lng}
        ringAltitude={(d: any) => (hoveredKey && getPointKey(d) === hoveredKey ? 0.040 : 0.030)}
        ringColor={(d: any) => {
          const isHot = hoveredKey && getPointKey(d) === hoveredKey;
          return [isHot ? RING_ORANGE : RING_ORANGE_FADE, isHot ? RING_ORANGE_FADE : 'rgba(255, 103, 27, 0)'];
        }}
        ringMaxRadius={(d: any) => (hoveredKey && getPointKey(d) === hoveredKey ? 2.35 : 1.9)}
        ringPropagationSpeed={(d: any) => (hoveredKey && getPointKey(d) === hoveredKey ? 3.0 : 2.4)}
        ringRepeatPeriod={(d: any) => {
          // De-sync pulses so the globe feels alive.
          const key = getPointKey(d);
          let hash = 0;
          for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
          const base = 1050 + (hash % 650); // 1050..1700
          return hoveredKey && key === hoveredKey ? 720 : base;
        }}

        arcsData={arcsData}
        arcColor={() => [ARC_YELLOW_FADE, ARC_YELLOW]}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1400}
        arcStroke={0.7}

        enablePointerInteraction
      />

      {hovered && popoverPos && (
        <div
          className="globe-popover"
          style={{
            left: popoverPos.x + 14,
            top: popoverPos.y + 14
          }}
          role="status"
          aria-live="polite"
        >
          <div className="globe-popover-title">{hoverTitle}</div>
          {hoverSubtitle && <div className="globe-popover-subtitle">{hoverSubtitle}</div>}
        </div>
      )}
    </div>
  );
};

export default ResearchGlobe;
