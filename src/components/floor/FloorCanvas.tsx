'use client';

import dynamic from 'next/dynamic';

import { useRef, useState, useEffect } from 'react';

const Editor = dynamic(() => import('./ExcalidrawEditor'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>読み込み中...</div> });

export default function FloorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ width: '100%', height: `${h}px` }}>
        <Editor />
      </div>
    </div>
  );
}
