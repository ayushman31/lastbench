'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { SignalingMessage, Participant } from '@/lib/types';
import { ICE_SERVERS } from '@/lib/types';

interface UseWebRTCOptions {
  localStream: MediaStream | null;
  clientId: string | null;
  participants: Participant[];
  onMessage: (message: SignalingMessage) => void;
  onStreamAdded: (clientId: string, stream: MediaStream) => void;
  onStreamRemoved: (clientId: string) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const {
    localStream,
    clientId,
    participants,
    onMessage,
    onStreamAdded,
    onStreamRemoved,
  } = options;

  // store peer connections
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const optionsRef = useRef(options);

  // update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const createPeerConnection = useCallback((remoteClientId: string): RTCPeerConnection => {
    console.log('[WebRTC] Creating peer connection for:', remoteClientId);

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // add local stream tracks
    if (optionsRef.current.localStream) {
      optionsRef.current.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, optionsRef.current.localStream!);
      });
    }

    // handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate to:', remoteClientId);
        optionsRef.current.onMessage({
          type: 'ice-candidate',
          to: remoteClientId,
          data: event.candidate.toJSON(),
          timestamp: Date.now(),
        });
      }
    };

    // handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from:', remoteClientId);
      if (event.streams && event.streams[0]) {
        optionsRef.current.onStreamAdded(remoteClientId, event.streams[0]);
      }
    };

    // handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState, 'for:', remoteClientId);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        optionsRef.current.onStreamRemoved(remoteClientId);
        peerConnectionsRef.current.delete(remoteClientId);
      }
    };

    // handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState, 'for:', remoteClientId);
    };

    peerConnectionsRef.current.set(remoteClientId, pc);
    return pc;
  }, []);

  const createOffer = useCallback(async (remoteClientId: string) => {
    try {
      console.log('[WebRTC] Creating offer for:', remoteClientId);
      
      const pc = createPeerConnection(remoteClientId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      optionsRef.current.onMessage({
        type: 'offer',
        to: remoteClientId,
        data: offer,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
    }
  }, [createPeerConnection]);

  const handleOffer = useCallback(async (
    fromClientId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    try {
      console.log('[WebRTC] Handling offer from:', fromClientId);

      const pc = createPeerConnection(fromClientId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      optionsRef.current.onMessage({
        type: 'answer',
        to: fromClientId,
        data: answer,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
    }
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (
    fromClientId: string,
    answer: RTCSessionDescriptionInit
  ) => {
    try {
      console.log('[WebRTC] Handling answer from:', fromClientId);

      const pc = peerConnectionsRef.current.get(fromClientId);
      if (!pc) {
        console.error('[WebRTC] No peer connection found for:', fromClientId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (
    fromClientId: string,
    candidate: RTCIceCandidateInit
  ) => {
    try {
      const pc = peerConnectionsRef.current.get(fromClientId);
      if (!pc) {
        console.error('[WebRTC] No peer connection found for:', fromClientId);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] Added ICE candidate from:', fromClientId);
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }, []);

  const closePeerConnection = useCallback((remoteClientId: string) => {
    const pc = peerConnectionsRef.current.get(remoteClientId);
    if (pc) {
      console.log('[WebRTC] Closing peer connection for:', remoteClientId);
      pc.close();
      peerConnectionsRef.current.delete(remoteClientId);
      optionsRef.current.onStreamRemoved(remoteClientId);
    }
  }, []);

  // update local stream tracks
  useEffect(() => {
    if (!localStream) return;

    // update all peer connections with new tracks
    peerConnectionsRef.current.forEach((pc, remoteClientId) => {
      // remove old senders
      pc.getSenders().forEach((sender) => {
        pc.removeTrack(sender);
      });

      // add new tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      console.log('[WebRTC] Updated tracks for:', remoteClientId);
    });
  }, [localStream]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[WebRTC] Cleaning up all peer connections');
      peerConnectionsRef.current.forEach((pc) => {
        pc.close();
      });
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection,
    peerConnections: peerConnectionsRef.current,
  };
}