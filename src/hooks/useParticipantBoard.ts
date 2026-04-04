import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// Same debounce with flush as in meeting page
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T & { flush: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  let lastArgs: any[] | null = null;
  const debounced = ((...args: any[]) => {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => { lastArgs = null; fn(...args); }, ms);
  }) as unknown as T & { flush: () => void };
  debounced.flush = () => {
    if (lastArgs) {
      clearTimeout(timer);
      const args = lastArgs;
      lastArgs = null;
      fn(...args);
    }
  };
  return debounced;
}

interface UseParticipantBoardProps {
  meetingId: string;
  participantId: string;
  floorSlug: string;
  userName: string;
  userId: string;
  isHost: boolean;
  isRedPen: boolean;
}

export function useParticipantBoard({ meetingId, participantId, floorSlug, userName, userId, isHost, isRedPen }: UseParticipantBoardProps) {
  const [api, setApi] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const isRemoteRef = useRef(false);
  const [sceneElements, setSceneElements] = useState<any[]>([]);
  const [annotationElements, setAnnotationElements] = useState<any[]>([]);
  const templateCopiedRef = useRef(false);

  // Connect to the participant's board document
  useEffect(() => {
    if (!api) return;

    const boardDocName = `board-${meetingId}-${participantId}`;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const yScene = ydoc.getMap('scene');
    const yAnnotations = ydoc.getMap('annotations');

    const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;
    const provider = new HocuspocusProvider({
      url: hocuspocusUrl,
      name: boardDocName,
      document: ydoc,
      token: JSON.stringify({ floor: floorSlug, boardId: `${floorSlug}-${meetingId}-${participantId}`, userId }),
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });
    providerRef.current = provider;

    provider.awareness?.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });
    const updateCount = () => setUserCount(provider.awareness?.getStates().size || 1);
    provider.awareness?.on('change', updateCount);
    updateCount();

    // Load initial scene from Yjs
    provider.on('synced', ({ state }: { state: boolean }) => {
      if (!state) return;
      const stored = yScene.get('elements');
      const annotations = yAnnotations.get('elements');

      if (stored && Array.isArray(stored) && stored.length > 0) {
        isRemoteRef.current = true;
        setSceneElements(stored);
        const combined = [...stored, ...(Array.isArray(annotations) ? annotations.map((el: any) => ({ ...el, locked: true })) : [])];
        api.updateScene({ elements: combined });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      } else if (!templateCopiedRef.current) {
        // Scene is empty - try to copy from template
        templateCopiedRef.current = true;
        copyFromTemplate(meetingId, floorSlug, userId, yScene, api, isRemoteRef);
      }

      if (annotations && Array.isArray(annotations)) {
        setAnnotationElements(annotations);
      }
    });

    // Listen for remote scene changes
    yScene.observe((event) => {
      if (event.transaction.local) return;
      const elements = yScene.get('elements');
      if (elements && Array.isArray(elements)) {
        isRemoteRef.current = true;
        setSceneElements(elements);
        const annotations = yAnnotations.get('elements');
        const combined = [...elements, ...(Array.isArray(annotations) ? annotations.map((el: any) => ({ ...el, locked: true })) : [])];
        api.updateScene({ elements: combined });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
    });

    // Listen for annotation changes
    yAnnotations.observe((event) => {
      if (event.transaction.local) return;
      const annotations = yAnnotations.get('elements');
      if (annotations && Array.isArray(annotations)) {
        isRemoteRef.current = true;
        setAnnotationElements(annotations);
        const scene = yScene.get('elements');
        const combined = [...(Array.isArray(scene) ? scene : []), ...annotations.map((el: any) => ({ ...el, locked: true }))];
        api.updateScene({ elements: combined });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
    });

    return () => {
      provider.awareness?.off('change', updateCount);
      provider.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [api, meetingId, participantId, userName, floorSlug, userId]);

  // Debounced sync for scene elements
  const syncToYjs = useMemo(
    () => debounce((elements: any[]) => {
      if (!ydocRef.current || isRemoteRef.current) return;
      const yScene = ydocRef.current.getMap('scene');
      // Filter out annotation elements before saving to scene
      const sceneOnly = elements.filter((el: any) => !el.customData?.annotation);
      yScene.set('elements', sceneOnly);
    }, 300),
    []
  );

  // Debounced sync for annotation elements
  const syncAnnotations = useMemo(
    () => debounce((elements: any[]) => {
      if (!ydocRef.current) return;
      const yAnnotations = ydocRef.current.getMap('annotations');
      yAnnotations.set('elements', elements);
    }, 300),
    []
  );

  const handleChange = useCallback((elements: readonly any[]) => {
    if (isRemoteRef.current) return;

    if (isRedPen && isHost) {
      // In red pen mode: separate annotations from scene elements
      const currentAnnotations = annotationElements;
      const newAnnotations: any[] = [];
      const sceneOnly: any[] = [];

      for (const el of elements) {
        if (el.customData?.annotation) {
          newAnnotations.push(el);
        } else {
          // Check if this is a NEW element not in the current scene
          const existsInScene = sceneElements.some(s => s.id === el.id);
          if (!existsInScene && el.type !== 'selection') {
            // New element drawn by host in red pen mode -> mark as annotation
            newAnnotations.push({
              ...el,
              strokeColor: '#ef4444',
              customData: { annotation: true, annotatorId: userId },
            });
          } else {
            sceneOnly.push(el);
          }
        }
      }

      if (newAnnotations.length > 0 || newAnnotations.length !== currentAnnotations.length) {
        const allAnnotations = [...currentAnnotations.filter((a: any) => !newAnnotations.some((n: any) => n.id === a.id)), ...newAnnotations];
        setAnnotationElements(allAnnotations);
        syncAnnotations(allAnnotations);
      }
    } else {
      // Normal mode: sync all non-annotation elements to scene
      syncToYjs([...elements]);
    }
  }, [syncToYjs, syncAnnotations, isRedPen, isHost, userId, sceneElements, annotationElements]);

  return { api, setApi, isConnected, userCount, handleChange, ydocRef, syncToYjs, sceneElements, annotationElements };
}

// Helper: copy template elements to participant's board
async function copyFromTemplate(
  meetingId: string, floorSlug: string, userId: string,
  yScene: Y.Map<any>, api: any, isRemoteRef: React.MutableRefObject<boolean>
) {
  const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;
  const templateDoc = new Y.Doc();
  const templateProvider = new HocuspocusProvider({
    url: hocuspocusUrl,
    name: `board-${meetingId}-template`,
    document: templateDoc,
    token: JSON.stringify({ floor: floorSlug, boardId: `${floorSlug}-${meetingId}-template`, userId }),
  });

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      templateProvider.destroy();
      templateDoc.destroy();
      resolve();
    }, 5000);

    templateProvider.on('synced', ({ state }: { state: boolean }) => {
      if (!state) return;
      clearTimeout(timeout);
      const templateScene = templateDoc.getMap('scene');
      const elements = templateScene.get('elements');
      if (elements && Array.isArray(elements) && elements.length > 0) {
        isRemoteRef.current = true;
        yScene.set('elements', elements);
        api.updateScene({ elements });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
      setTimeout(() => {
        templateProvider.destroy();
        templateDoc.destroy();
        resolve();
      }, 500);
    });
  });
}
