'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import RightPanel from '@/components/layout/RightPanel';
import FloorCanvas from '@/components/floor/FloorCanvas';
import EditorPanel from '@/components/editor/EditorPanel';
import AvatarSelector from '@/components/profile/AvatarSelector';
import SpaceWizard from '@/components/editor/SpaceWizard';
import { useOfficeStore } from '@/store/officeStore';

export default function Home() {
  const { editorMode, showAvatarSelector } = useOfficeStore();
  const [showSpaceWizard, setShowSpaceWizard] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <FloorCanvas />
          {editorMode === 'edit' && <EditorPanel onAddSpace={() => setShowSpaceWizard(true)} />}
          <RightPanel />
        </div>
      </div>
      {showAvatarSelector && <AvatarSelector />}
      {showSpaceWizard && <SpaceWizard onClose={() => setShowSpaceWizard(false)} />}
    </div>
  );
}
