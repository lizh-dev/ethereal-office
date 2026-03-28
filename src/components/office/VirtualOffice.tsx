'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { exportToSvg } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import AvatarLayer from './AvatarLayer';
import ChatInput from './ChatInput';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const PAN_SPEED = 1.2;

export default function VirtualOffice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState({ width: 1200, height: 800 });
  const [svgOffset, setSvgOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });

  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const moveCurrentUser = useOfficeStore((s) => s.moveCurrentUser);

  // Export Excalidraw scene as SVG background
  useEffect(() => {
    if (!excalidrawAPI) return;

    const doExport = async () => {
      try {
        const elements = excalidrawAPI.getSceneElements();
        if (!elements || elements.length === 0) return;
        const files = excalidrawAPI.getFiles();
        const appState = excalidrawAPI.getAppState();

        const svg = await exportToSvg({
          elements,
          appState: {
            ...appState,
            exportBackground: true,
            exportWithDarkMode: false,
          },
          files,
          exportPadding: 20,
        });

        // Parse viewBox to get coordinate offset and size
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(' ').map(Number);
          if (parts.length === 4) {
            setSvgOffset({ x: parts[0], y: parts[1] });
            setSvgSize({ width: parts[2], height: parts[3] });
          }
        } else {
          const w = parseFloat(svg.getAttribute('width') || '1200');
          const h = parseFloat(svg.getAttribute('height') || '800');
          setSvgSize({ width: w, height: h });
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const encoded = encodeURIComponent(svgString);
        setSvgDataUrl(`data:image/svg+xml,${encoded}`);
      } catch (err) {
        console.error('Failed to export SVG:', err);
      }
    };

    doExport();
    const interval = setInterval(doExport, 3000);
    return () => clearInterval(interval);
  }, [excalidrawAPI]);

  // Scroll = pan, Ctrl+scroll = zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const delta = -e.deltaY * 0.003;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * z)));
      } else {
        // Pan
        setPan((p) => ({
          x: p.x - e.deltaX * PAN_SPEED,
          y: p.y - e.deltaY * PAN_SPEED,
        }));
      }
    },
    [],
  );

  // Middle-click or right-click drag to pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setPanOrigin(pan);
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panOrigin.x + (e.clientX - panStart.x),
        y: panOrigin.y + (e.clientY - panStart.y),
      });
    },
    [isPanning, panStart, panOrigin],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Click to move avatar (convert screen coords to Excalidraw scene coords)
  const handleFloorClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) return;
      if (e.button !== 0 || e.altKey) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Convert screen position to Excalidraw scene coordinates
      // The transformed layer maps scene coords to screen like:
      //   screenX = pan.x + (sceneCoord - svgOffset.x) * zoom
      // So sceneCoord = (screenX - pan.x) / zoom + svgOffset.x
      const sceneX = (e.clientX - rect.left - pan.x) / zoom + svgOffset.x;
      const sceneY = (e.clientY - rect.top - pan.y) / zoom + svgOffset.y;

      moveCurrentUser(sceneX, sceneY);
    },
    [zoom, pan, isPanning, moveCurrentUser, svgOffset],
  );

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#e8e4df',
        cursor: isPanning ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Transformed layer: SVG background + avatars */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: svgSize.width,
          height: svgSize.height,
        }}
        onClick={handleFloorClick}
      >
        {/* SVG Background */}
        {svgDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={svgDataUrl}
            alt="Floor plan"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: svgSize.width,
              height: svgSize.height,
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 18,
            }}
          >
            フロアプランを読み込み中...
          </div>
        )}

        {/* Avatar layer renders on top. Offset so avatar positions
            (which are in Excalidraw scene coords) align with the SVG. */}
        <div style={{ position: 'absolute', left: -svgOffset.x, top: -svgOffset.y, width: '100%', height: '100%' }}>
          <AvatarLayer />
        </div>
      </div>

      {/* Zoom controls (fixed position in bottom-left) */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 50,
        }}
      >
        <ZoomButton onClick={zoomIn} label="+" />
        <ZoomButton onClick={resetView} label="1:1" small />
        <ZoomButton onClick={zoomOut} label="-" />
        <div
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: '#6b7280',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 4,
            padding: '2px 4px',
            marginTop: 2,
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Minimap hint */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontSize: 11,
          color: '#9ca3af',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: '4px 8px',
          borderRadius: 6,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        Scroll: pan / Ctrl+Scroll: zoom / Click: move
      </div>

      {/* Chat input at bottom */}
      <ChatInput />
    </div>
  );
}

function ZoomButton({ onClick, label, small }: { onClick: () => void; label: string; small?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: 36,
        height: small ? 28 : 36,
        borderRadius: 8,
        border: '1px solid #d1d5db',
        backgroundColor: 'rgba(255,255,255,0.9)',
        cursor: 'pointer',
        fontSize: small ? 10 : 18,
        fontWeight: 600,
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; }}
    >
      {label}
    </button>
  );
}
