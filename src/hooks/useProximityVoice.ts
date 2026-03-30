'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { WebRTCState } from './useWebRTC';

const PROXIMITY_CONNECT_DIST = 180; // Start connecting when closer than this
const PROXIMITY_DISCONNECT_DIST = 250; // Disconnect when farther than this
const MAX_PROXIMITY_PEERS = 5;
const CHECK_INTERVAL_MS = 500;

/**
 * Proximity Voice: automatically connect/disconnect and adjust volume
 * based on distance between users on the floor canvas.
 * Only active when user is NOT seated (walking around).
 */
export function useProximityVoice(webrtc: WebRTCState) {
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const users = useOfficeStore((s) => s.users);
  const autoVoiceEnabled = useOfficeStore((s) => s.autoVoiceEnabled);

  const proximityPeersRef = useRef<Set<string>>(new Set());
  const isActiveRef = useRef(false);
  const streamAcquiredRef = useRef(false);

  const getDistance = useCallback((userId: string): number => {
    const user = users.find((u) => u.id === userId);
    if (!user) return Infinity;
    const dx = currentUser.position.x - user.position.x;
    const dy = currentUser.position.y - user.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [currentUser.position, users]);

  useEffect(() => {
    // Only active when NOT seated and auto voice is enabled
    if (currentSeatId || !autoVoiceEnabled || !currentUser.id || currentUser.id === 'pending') {
      // Clean up proximity connections if we were active
      if (isActiveRef.current) {
        for (const peerId of proximityPeersRef.current) {
          webrtc.removePeer(peerId);
        }
        proximityPeersRef.current.clear();
        isActiveRef.current = false;
        streamAcquiredRef.current = false;
      }
      return;
    }

    isActiveRef.current = true;

    const interval = setInterval(async () => {
      // Find all users within proximity range, sorted by distance
      const nearbyUsers = users
        .filter((u) => u.id !== currentUser.id && u.status !== 'offline')
        .map((u) => ({ id: u.id, dist: getDistance(u.id) }))
        .filter((u) => u.dist < PROXIMITY_DISCONNECT_DIST)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, MAX_PROXIMITY_PEERS);

      const nearbyIds = new Set(nearbyUsers.map((u) => u.id));

      // Disconnect peers that are now too far (hysteresis: use DISCONNECT_DIST)
      for (const peerId of proximityPeersRef.current) {
        if (!nearbyIds.has(peerId) || getDistance(peerId) > PROXIMITY_DISCONNECT_DIST) {
          webrtc.removePeer(peerId);
          proximityPeersRef.current.delete(peerId);
        }
      }

      // Connect to new nearby peers (use CONNECT_DIST for new connections)
      for (const { id, dist } of nearbyUsers) {
        if (dist < PROXIMITY_CONNECT_DIST && !proximityPeersRef.current.has(id)) {
          // Acquire local stream on first proximity connection
          if (!streamAcquiredRef.current) {
            await webrtc.acquireLocalStream();
            streamAcquiredRef.current = true;
          }
          await webrtc.connectToPeer(id);
          proximityPeersRef.current.add(id);
        }
      }

      // Adjust volume based on distance for all connected proximity peers
      for (const { id, dist } of nearbyUsers) {
        if (proximityPeersRef.current.has(id)) {
          // Linear volume: 1.0 at distance 0, 0.0 at DISCONNECT_DIST
          const volume = Math.max(0, 1 - dist / PROXIMITY_DISCONNECT_DIST);
          webrtc.setRemoteVolume(id, volume);
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [currentSeatId, autoVoiceEnabled, currentUser.id, users, getDistance, webrtc]);
}
