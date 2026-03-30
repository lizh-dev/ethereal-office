'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';

export interface FocusTimerState {
  isActive: boolean;
  isBreak: boolean;
  remainingSeconds: number;
  startFocus: (minutes: number) => void;
  stopFocus: () => void;
}

export function useFocusTimer(): FocusTimerState {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [breakEndTime, setBreakEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = endTime !== null || breakEndTime !== null;
  const isBreak = breakEndTime !== null && endTime === null;

  const startFocus = useCallback((minutes: number) => {
    const end = Date.now() + minutes * 60 * 1000;
    setEndTime(end);
    setBreakEndTime(null);
    // Set status to focusing
    const store = useOfficeStore.getState();
    store.setCurrentUserStatus('focusing');
  }, []);

  const stopFocus = useCallback(() => {
    setEndTime(null);
    setBreakEndTime(null);
    setRemainingSeconds(0);
    // Reset status to online and clear status message
    const store = useOfficeStore.getState();
    store.setCurrentUserStatus('online');
    store.setStatusMessage('');
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      if (endTime && now >= endTime) {
        // Focus period ended -> start break (5 min)
        setEndTime(null);
        setBreakEndTime(now + 5 * 60 * 1000);
        useOfficeStore.getState().setCurrentUserStatus('online');
        useOfficeStore.getState().setStatusMessage('休憩中');
      } else if (breakEndTime && now >= breakEndTime) {
        // Break ended
        setBreakEndTime(null);
        setRemainingSeconds(0);
        useOfficeStore.getState().setStatusMessage('');
      } else {
        const target = endTime || breakEndTime || 0;
        setRemainingSeconds(Math.max(0, Math.ceil((target - now) / 1000)));
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endTime, breakEndTime, isActive]);

  // Update status message with remaining time
  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) return;
    const min = Math.floor(remainingSeconds / 60);
    const sec = remainingSeconds % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;
    const label = isBreak ? `休憩中 ${timeStr}` : `集中中 ${timeStr}`;
    useOfficeStore.getState().setStatusMessage(label);
  }, [remainingSeconds, isActive, isBreak]);

  return { isActive, isBreak, remainingSeconds, startFocus, stopFocus };
}
