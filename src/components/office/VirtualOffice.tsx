'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { exportToSvg } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import AvatarLayer from './AvatarLayer';
import SeatLayer from './SeatLayer';
import ChatInput from './ChatInput';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const PAN_SPEED = 1.2;

export default function VirtualOffice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState({ width: 1200, height: 800 });
  const [svgOffset, setSvgOffset] = useState({ x: 0, y: 0 });
  // Offset to map Excalidraw coords → SVG pixel coords
  const [sceneOffset, setSceneOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });

  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const moveCurrentUser = useOfficeStore((s) => s.moveCurrentUser);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const standUp = useOfficeStore((s) => s.standUp);

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

        // Compute scene offset: Excalidraw coord → SVG pixel position
        // SVG wraps elements in <g transform="translate(padding, padding)">
        // and positions elements relative to minX/minY of all elements
        const PADDING = 20;
        const nonDeleted = elements.filter((el: any) => !el.isDeleted);
        if (nonDeleted.length > 0) {
          const minX = Math.min(...nonDeleted.map((el: any) => el.x));
          const minY = Math.min(...nonDeleted.map((el: any) => el.y));
          // SVG pixel = (excalidrawCoord - minElement) + padding
          // So offset to subtract from excalidraw coords = minElement - padding
          setSceneOffset({ x: minX - PADDING, y: minY - PADDING });
        }

        // Auto-generate zones from chair elements and assign users to seats
        // Chairs = small ellipses with chair color
        const chairs = nonDeleted.filter((el: any) =>
          el.type === 'ellipse' && el.backgroundColor === '#9ca3af' && el.width <= 30 && el.height <= 30
        );
        if (chairs.length > 0) {
          const store = useOfficeStore.getState();
          // Create seats at SVG-pixel coordinates (already offset by sceneOffset)
          const offset = { x: minX - PADDING, y: minY - PADDING };
          const seats = chairs.map((c: any, i: number) => ({
            id: `seat-${i}`,
            roomId: '',
            x: c.x + c.width / 2 - offset.x,
            y: c.y + c.height / 2 - offset.y,
            occupied: false as boolean,
            occupiedBy: undefined as string | undefined,
          }));

          // Assign mock users to seats
          const users = store.users;
          users.forEach((u, idx) => {
            if (idx < seats.length) {
              seats[idx].occupied = true;
              seats[idx].occupiedBy = u.id;
            }
          });

          // Update user positions to their seat's SVG coordinates
          const updatedUsers = users.map((u, idx) => {
            if (idx < seats.length) {
              return { ...u, position: { x: seats[idx].x, y: seats[idx].y } };
            }
            return u;
          });

          const zones = [{ id: 'auto-all', type: 'desk' as const, name: 'オフィス', x: 0, y: 0, w: svgSize.width, h: svgSize.height, seats }];
          useOfficeStore.setState({ zones, users: updatedUsers });
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
  // Only allow free movement when NOT seated
  const handleFloorClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) return;
      if (e.button !== 0 || e.altKey) return;
      if (currentSeatId) return; // seated users cannot free-move

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Convert screen coords to SVG pixel coords
      const svgX = (e.clientX - rect.left - pan.x) / zoom;
      const svgY = (e.clientY - rect.top - pan.y) / zoom;

      moveCurrentUser(svgX, svgY);
    },
    [zoom, pan, isPanning, moveCurrentUser, currentSeatId],
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

        {/* Seat indicators layer (below avatars, above SVG) */}
        {/* Seat/Avatar layers — positions already in SVG pixel coords */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
          <SeatLayer />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
          <AvatarLayer />
        </div>
      </div>

      {/* Stand Up button (shown when seated) */}
      {currentSeatId && (
        <button
          onClick={(e) => { e.stopPropagation(); standUp(); }}
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            padding: '8px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: '#4F46E5',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.4)';
          }}
        >
          <span style={{ fontSize: 16 }}>🧍</span>
          立ち上がる
        </button>
      )}

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
