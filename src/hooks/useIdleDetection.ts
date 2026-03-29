'use client';

import { useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { WsSend } from '@/contexts/WebSocketContext';
import type { PresenceStatus } from '@/types';

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export function useIdleDetection(wsSend: WsSend) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<PresenceStatus>('online');
  const isIdleRef = useRef(false);
  const wsSendRef = useRef(wsSend);
  wsSendRef.current = wsSend;

  useEffect(() => {
    const setIdle = () => {
      if (isIdleRef.current) return;
      const store = useOfficeStore.getState();
      if (store.currentUser.status === 'offline') return; // already offline
      prevStatusRef.current = store.currentUser.status;
      isIdleRef.current = true;
      store.setCurrentUserStatus('offline');
      wsSendRef.current.status('offline');
    };

    const setActive = () => {
      if (!isIdleRef.current) return;
      isIdleRef.current = false;
      const store = useOfficeStore.getState();
      const restoreStatus = prevStatusRef.current === 'offline' ? 'online' : prevStatusRef.current;
      store.setCurrentUserStatus(restoreStatus);
      wsSendRef.current.status(restoreStatus);
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isIdleRef.current) setActive();
      timerRef.current = setTimeout(setIdle, IDLE_TIMEOUT);
    };

    // Visibility change (tab hidden)
    const handleVisibility = () => {
      if (document.hidden) {
        // Start shorter timer when tab is hidden
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(setIdle, 30 * 1000); // 30 sec when hidden
      } else {
        setActive();
        resetTimer();
      }
    };

    // User activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);

    // Start timer
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
