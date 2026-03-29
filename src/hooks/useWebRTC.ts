'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import { onRTCSignal } from './useWebSocket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

interface PeerEntry {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVoiceActive: boolean;
  activeSpeakers: Set<string>;
  toggleMute: () => void;
  leaveVoice: () => void;
  joinVoice: () => void;
  canJoinVoice: boolean;
}

/**
 * Determines which users share the same zone as the current user.
 * Returns an array of user IDs (excluding the current user).
 */
function getZonePeers(currentUserId: string, currentSeatId: string | null): string[] {
  if (!currentSeatId) return [];
  const state = useOfficeStore.getState();
  // Find the zone containing the current seat
  let currentZoneId: string | null = null;
  for (const zone of state.zones) {
    if (zone.seats.some((s) => s.id === currentSeatId)) {
      currentZoneId = zone.id;
      break;
    }
  }
  if (!currentZoneId) return [];

  // Find all other users seated in the same zone
  const zone = state.zones.find((z) => z.id === currentZoneId);
  if (!zone) return [];

  const peerIds: string[] = [];
  for (const seat of zone.seats) {
    if (seat.occupied && seat.occupiedBy && seat.occupiedBy !== currentUserId) {
      peerIds.push(seat.occupiedBy);
    }
  }
  return peerIds;
}

export function useWebRTC(): WebRTCState {
  const wsSend = useWsSend();
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<Map<string, string[]>>(new Map());
  // Track whether we initiated the connection (offerer) to avoid duplicate negotiations
  const isCleaningUpRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const currentUser = useOfficeStore((s) => s.currentUser);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);

  // Helper: update the remoteStreams state from peersRef
  const syncRemoteStreams = useCallback(() => {
    const map = new Map<string, MediaStream>();
    for (const [id, entry] of peersRef.current) {
      map.set(id, entry.remoteStream);
    }
    setRemoteStreams(new Map(map));
  }, []);

  // Create a peer connection for a specific remote user
  const createPeerConnection = useCallback(
    (remoteUserId: string): PeerEntry => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsSend.rtcCandidate(remoteUserId, JSON.stringify(event.candidate.toJSON()));
        }
      };

      pc.ontrack = (event) => {
        for (const track of event.streams[0]?.getTracks() ?? []) {
          remoteStream.addTrack(track);
        }
        syncRemoteStreams();

        // Set up audio level detection for active speaker
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          const ctx = audioContextRef.current;
          const source = ctx.createMediaStreamSource(remoteStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          // Clear previous interval for this user
          const prev = analyserIntervalsRef.current.get(remoteUserId);
          if (prev) clearInterval(prev);

          const interval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setActiveSpeakers((prev) => {
              const next = new Set(prev);
              if (avg > 15) {
                next.add(remoteUserId);
              } else {
                next.delete(remoteUserId);
              }
              // Only update if changed
              if (next.size !== prev.size || [...next].some((v) => !prev.has(v))) {
                return next;
              }
              return prev;
            });
          }, 200);
          analyserIntervalsRef.current.set(remoteUserId, interval);
        } catch {
          // AudioContext not available
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
          removePeer(remoteUserId);
        }
      };

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      const entry: PeerEntry = { pc, remoteStream };
      peersRef.current.set(remoteUserId, entry);
      return entry;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsSend, syncRemoteStreams],
  );

  // Remove a peer connection
  const removePeer = useCallback(
    (remoteUserId: string) => {
      const entry = peersRef.current.get(remoteUserId);
      if (entry) {
        entry.pc.close();
        peersRef.current.delete(remoteUserId);
        syncRemoteStreams();
      }
      // Clean up analyser interval
      const interval = analyserIntervalsRef.current.get(remoteUserId);
      if (interval) {
        clearInterval(interval);
        analyserIntervalsRef.current.delete(remoteUserId);
      }
      setActiveSpeakers((prev) => {
        const next = new Set(prev);
        next.delete(remoteUserId);
        return next;
      });
    },
    [syncRemoteStreams],
  );

  // Initiate connection to a remote peer (we are the offerer)
  const connectToPeer = useCallback(
    async (remoteUserId: string) => {
      if (peersRef.current.has(remoteUserId)) return;
      const { pc } = createPeerConnection(remoteUserId);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsSend.rtcOffer(remoteUserId, JSON.stringify(offer));
      } catch (err) {
        console.error('[WebRTC] Failed to create offer for', remoteUserId, err);
        removePeer(remoteUserId);
      }
    },
    [createPeerConnection, wsSend, removePeer],
  );

  // Acquire local audio stream
  const acquireLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Start muted
      for (const track of stream.getAudioTracks()) {
        track.enabled = false;
      }
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('[WebRTC] Failed to acquire audio:', err);
      return null;
    }
  }, []);

  // Stop local stream
  const releaseLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
  }, []);

  // Disconnect all peers
  const disconnectAll = useCallback(() => {
    isCleaningUpRef.current = true;
    for (const [id] of peersRef.current) {
      removePeer(id);
    }
    peersRef.current.clear();
    releaseLocalStream();
    setIsVoiceActive(false);
    setIsMuted(true);
    setRemoteStreams(new Map());
    setActiveSpeakers(new Set());
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    for (const interval of analyserIntervalsRef.current.values()) {
      clearInterval(interval);
    }
    analyserIntervalsRef.current.clear();
    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, [removePeer, releaseLocalStream]);

  // Handle incoming signaling messages
  useEffect(() => {
    const unsubscribe = onRTCSignal(async (msg) => {
      if (isCleaningUpRef.current) return;

      if (msg.type === 'rtc_offer' && msg.sdp) {
        // Someone is offering to connect to us
        const stream = await acquireLocalStream();
        if (!stream) return;

        let entry = peersRef.current.get(msg.userId);
        if (entry) {
          // Re-negotiation: close existing and recreate
          entry.pc.close();
          peersRef.current.delete(msg.userId);
        }
        entry = createPeerConnection(msg.userId);

        try {
          const offer = JSON.parse(msg.sdp) as RTCSessionDescriptionInit;
          await entry.pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Apply any pending ICE candidates
          const pending = pendingCandidatesRef.current.get(msg.userId) || [];
          for (const c of pending) {
            try {
              await entry.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(c)));
            } catch { /* ignore */ }
          }
          pendingCandidatesRef.current.delete(msg.userId);

          const answer = await entry.pc.createAnswer();
          await entry.pc.setLocalDescription(answer);
          wsSend.rtcAnswer(msg.userId, JSON.stringify(answer));

          setIsVoiceActive(true);
        } catch (err) {
          console.error('[WebRTC] Failed to handle offer from', msg.userId, err);
          removePeer(msg.userId);
        }
      }

      if (msg.type === 'rtc_answer' && msg.sdp) {
        const entry = peersRef.current.get(msg.userId);
        if (!entry) return;
        try {
          const answer = JSON.parse(msg.sdp) as RTCSessionDescriptionInit;
          await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Apply any pending ICE candidates
          const pending = pendingCandidatesRef.current.get(msg.userId) || [];
          for (const c of pending) {
            try {
              await entry.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(c)));
            } catch { /* ignore */ }
          }
          pendingCandidatesRef.current.delete(msg.userId);
        } catch (err) {
          console.error('[WebRTC] Failed to handle answer from', msg.userId, err);
        }
      }

      if (msg.type === 'rtc_candidate' && msg.candidate) {
        const entry = peersRef.current.get(msg.userId);
        if (!entry || !entry.pc.remoteDescription) {
          // Queue the candidate until we have the remote description
          const pending = pendingCandidatesRef.current.get(msg.userId) || [];
          pending.push(msg.candidate);
          pendingCandidatesRef.current.set(msg.userId, pending);
          return;
        }
        try {
          const candidate = JSON.parse(msg.candidate) as RTCIceCandidateInit;
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Failed to add ICE candidate from', msg.userId, err);
        }
      }
    });

    return unsubscribe;
  }, [acquireLocalStream, createPeerConnection, wsSend, removePeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getAudioTracks()) {
          track.enabled = !next;
        }
      }
      wsSend.media(next, false);
      return next;
    });
  }, [wsSend]);

  // Leave voice
  const leaveVoice = useCallback(() => {
    disconnectAll();
  }, [disconnectAll]);

  // Join voice — manually connect to peers in same zone
  const joinVoice = useCallback(async () => {
    if (!currentSeatId || !currentUser.id || currentUser.id === 'pending') return;
    const zonePeers = getZonePeers(currentUser.id, currentSeatId);
    const stream = await acquireLocalStream();
    if (!stream) return;

    setIsVoiceActive(true);

    for (const peerId of zonePeers) {
      if (!peersRef.current.has(peerId) && currentUser.id < peerId) {
        await connectToPeer(peerId);
      }
    }
  }, [currentSeatId, currentUser.id, acquireLocalStream, connectToPeer]);

  // Whether voice can be joined (seated + others in same zone)
  const canJoinVoice = !!currentSeatId && currentUser.id !== 'pending' &&
    getZonePeers(currentUser.id, currentSeatId).length > 0;

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    isMuted,
    isVoiceActive,
    activeSpeakers,
    toggleMute,
    leaveVoice,
    joinVoice,
    canJoinVoice,
  };
}
