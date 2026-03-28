'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';

const Editor = dynamic(() => import('./ExcalidrawEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      読み込み中...
    </div>
  ),
});

const VirtualOffice = dynamic(() => import('@/components/office/VirtualOffice'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', backgroundColor: '#e8e4df' }}>
      バーチャルオフィスを準備中...
    </div>
  ),
});

export default function FloorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const isViewMode = editorMode !== 'edit';

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Always mount Editor so the Excalidraw API stays available for SVG export.
          In view mode we hide it offscreen. */}
      <div
        style={{
          width: '100%',
          height: `${h}px`,
          ...(isViewMode ? { position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' as const } : {}),
        }}
      >
        <Editor viewMode={false} />
      </div>
      {isViewMode && (
        <div style={{ width: '100%', height: `${h}px` }}>
          <VirtualOffice />
        </div>
      )}
    </div>
  );
}
