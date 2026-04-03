'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';

const JITSI_DOMAIN = 'localhost:8443';

export interface JitsiVoiceState {
  activeRoom: string | null;
  activeMode: 'zone' | 'call' | null;
  zoneName: string | null;
  participantCount: number;
  isMuted: boolean;
  isVideoOn: boolean;
  isCollapsed: boolean;
  jitsiApi: any | null;
  joinZoneRoom: (zoneId: string, zoneName: string) => void;
  joinCallRoom: (targetUserId: string, targetUserName: string) => void;
  manualJoin: () => void;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleCollapse: () => void;
}

/**
 * Finds the zone containing the given seat and returns zone peers.
 */
function getZoneForSeat(currentUserId: string, seatId: string | null): { zoneId: string; zoneName: string; hasPeers: boolean } | null {
  if (!seatId) return null;
  const state = useOfficeStore.getState();
  for (const zone of state.zones) {
    const seat = zone.seats.find(s => s.id === seatId);
    if (seat) {
      const hasPeers = zone.seats.some(s => s.occupied && s.occupiedBy && s.occupiedBy !== currentUserId);
      return { zoneId: zone.id, zoneName: zone.name, hasPeers };
    }
  }
  return null;
}

export function useJitsiVoice(): JitsiVoiceState {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'zone' | 'call' | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const jitsiApiRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const joiningRef = useRef(false);

  const currentUser = useOfficeStore(s => s.currentUser);
  const currentSeatId = useOfficeStore(s => s.currentSeatId);
  const callRequestStatus = useOfficeStore(s => s.callRequestStatus);
  const callTargetUserId = useOfficeStore(s => s.callTargetUserId);
  const manualJoinTrigger = useOfficeStore(s => s.jitsiManualJoinTrigger);

  // Get floor slug from URL
  const getFloorSlug = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const parts = window.location.pathname.split('/');
    return parts[2] || '';
  }, []);

  // Ensure Jitsi external API script is loaded
  const ensureJitsiScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      if (scriptLoadedRef.current) {
        // Script is loading, wait for it
        const check = setInterval(() => {
          if (window.JitsiMeetExternalAPI) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(check); reject(new Error('Jitsi script load timeout')); }, 10000);
        return;
      }
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = '/jitsi/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { scriptLoadedRef.current = false; reject(new Error('Failed to load Jitsi API')); };
      document.head.appendChild(script);
    });
  }, []);

  // Create Jitsi room
  const createJitsiRoom = useCallback(async (roomName: string, mode: 'zone' | 'call', displayZoneName?: string) => {
    if (jitsiApiRef.current || joiningRef.current) return;
    joiningRef.current = true;

    try {
      await ensureJitsiScript();

      const container = document.getElementById('jitsi-voice-container');
      if (!container) {
        console.error('[JitsiVoice] Container not found');
        joiningRef.current = false;
        return;
      }
      // Clear any previous content
      container.innerHTML = '';

      jitsiApiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: container,
        width: '100%',
        height: '100%',
        lang: 'ja',
        userInfo: { displayName: currentUser.name },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          defaultLanguage: 'ja',
          toolbarButtons: ['microphone', 'camera', 'desktop', 'chat', 'tileview', 'hangup'],
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          notifications: [],
          disableThirdPartyRequests: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'ゲスト',
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          HIDE_INVITE_MORE_HEADER: true,
        },
      });

      const api = jitsiApiRef.current;

      api.addListener('readyToClose', () => leaveRoom());
      api.addListener('videoConferenceLeft', () => leaveRoom());
      api.addListener('participantJoined', () => {
        api.getNumberOfParticipants().then?.((n: number) => {
          setParticipantCount(n);
          useOfficeStore.getState().setJitsiParticipantCount(n);
        });
      });
      api.addListener('participantLeft', () => {
        api.getNumberOfParticipants().then?.((n: number) => {
          setParticipantCount(n);
          useOfficeStore.getState().setJitsiParticipantCount(n);
        });
      });
      api.addListener('audioMuteStatusChanged', (data: { muted: boolean }) => {
        setIsMuted(data.muted);
      });
      api.addListener('videoMuteStatusChanged', (data: { muted: boolean }) => {
        setIsVideoOn(!data.muted);
      });

      setActiveRoom(roomName);
      setActiveMode(mode);
      setZoneName(displayZoneName || null);
      setParticipantCount(1);
      setIsMuted(false);
      setIsVideoOn(false);
      setIsCollapsed(false);

      useOfficeStore.getState().setActiveJitsiRoom(roomName, mode, displayZoneName);
      useOfficeStore.getState().setJitsiParticipantCount(1);
      useOfficeStore.getState().addActivity('voice', `${mode === 'zone' ? displayZoneName + 'の' : ''}通話に参加`);

    } catch (err) {
      console.error('[JitsiVoice] Failed to create room:', err);
    } finally {
      joiningRef.current = false;
    }
  }, [currentUser.name, ensureJitsiScript]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch { /* ignore */ }
      jitsiApiRef.current = null;
    }
    setActiveRoom(null);
    setActiveMode(null);
    setZoneName(null);
    setParticipantCount(0);
    setIsMuted(false);
    setIsVideoOn(false);
    joiningRef.current = false;

    useOfficeStore.getState().setActiveJitsiRoom(null, null);
    useOfficeStore.getState().setJitsiParticipantCount(0);
  }, []);

  // Join zone room
  const joinZoneRoom = useCallback((zoneId: string, zName: string) => {
    const slug = getFloorSlug();
    const roomName = `${slug}-zone-${zoneId}`;
    createJitsiRoom(roomName, 'zone', zName);
  }, [getFloorSlug, createJitsiRoom]);

  // Manual join: if seated, join that zone's room; otherwise create a floor-wide room
  const manualJoin = useCallback(() => {
    if (jitsiApiRef.current) {
      // Already in a room — toggle off
      leaveRoom();
      return;
    }
    const store = useOfficeStore.getState();
    const seatId = store.currentSeatId;
    const userId = store.currentUser.id;
    if (seatId && userId !== 'pending') {
      const zone = getZoneForSeat(userId, seatId);
      if (zone) {
        joinZoneRoom(zone.zoneId, zone.zoneName);
        return;
      }
    }
    // Not seated or no zone — join a floor-wide room
    const slug = getFloorSlug();
    createJitsiRoom(`${slug}-lobby`, 'zone', 'ロビー');
  }, [leaveRoom, joinZoneRoom, getFloorSlug, createJitsiRoom]);

  // Join 1:1 call room
  const joinCallRoom = useCallback((targetUserId: string, targetUserName: string) => {
    const slug = getFloorSlug();
    const ids = [currentUser.id, targetUserId].sort();
    const roomName = `${slug}-call-${ids[0].slice(0, 8)}-${ids[1].slice(0, 8)}`;
    createJitsiRoom(roomName, 'call', `${targetUserName}との通話`);
  }, [getFloorSlug, currentUser.id, createJitsiRoom]);


  // Handle call request accepted → join 1:1 call room
  const prevCallStatusRef = useRef(callRequestStatus);
  useEffect(() => {
    if (callRequestStatus === 'accepted' && callTargetUserId && prevCallStatusRef.current !== 'accepted') {
      // Find target user name
      const store = useOfficeStore.getState();
      const targetUser = store.users.find(u => u.id === callTargetUserId);
      const targetName = targetUser?.name || 'ゲスト';
      joinCallRoom(callTargetUserId, targetName);
      setTimeout(() => useOfficeStore.getState().clearCallRequest(), 500);
    }
    prevCallStatusRef.current = callRequestStatus;
  }, [callRequestStatus, callTargetUserId, joinCallRoom]);

  // Manual join triggered from ActionBar mic button
  const prevTriggerRef = useRef(manualJoinTrigger);
  useEffect(() => {
    if (manualJoinTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = manualJoinTrigger;
      manualJoin();
    }
  }, [manualJoinTrigger, manualJoin]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch { /* ignore */ }
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    jitsiApiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    jitsiApiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return {
    activeRoom,
    activeMode,
    zoneName,
    participantCount,
    isMuted,
    isVideoOn,
    isCollapsed,
    jitsiApi: jitsiApiRef.current,
    joinZoneRoom,
    joinCallRoom,
    manualJoin,
    leaveRoom,
    toggleMute,
    toggleVideo,
    toggleCollapse,
  };
}
