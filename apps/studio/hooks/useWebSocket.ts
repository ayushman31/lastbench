'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '@/lib/websocketClient';
import type { SignalingMessage, Participant } from '@/lib/types';

interface UseWebSocketOptions {
  token?: string; // for guest authentication
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (clientId: string) => void;
  onSessionUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseWebSocketReturn {
  wsClient: WebSocketClient | null;
  isConnected: boolean;
  clientId: string | null;
  participants: Participant[];
  joinSession: (sessionId: string, isHost: boolean) => void;
  leaveSession: () => void;
  sendOffer: (to: string, offer: RTCSessionDescriptionInit) => void;
  sendAnswer: (to: string, answer: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (to: string, candidate: RTCIceCandidateInit) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const optionsRef = useRef(options);

  // update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleMessage = useCallback((message: SignalingMessage) => {
    switch (message.type) {
      case 'session-update':
        if (message.data?.clientId) {
          setClientId(message.data.clientId);
        }

        // handle existing participants list
        if (message.data?.participants) {
          setParticipants((prev) => {
            const newParticipants = message.data.participants.map((p: any) => ({
              clientId: p.clientId,
              userId: p.userId,
              userName: p.userName || 'Unknown',
              isHost: p.isHost || false,
              isGuest: p.isGuest || false,
            }));
            return [...prev, ...newParticipants];
          });
        }

        optionsRef.current.onSessionUpdate?.(message.data);
        break;

      case 'peer-joined':
        if (message.data) {
          const newParticipant: Participant = {
            clientId: message.data.clientId,
            userId: message.data.userId,
            userName: message.data.userName || 'Unknown',
            isHost: message.data.isHost || false,
            isGuest: message.data.isGuest || false,
          };

          setParticipants((prev) => {
            // avoid duplicates
            if (prev.some((p) => p.clientId === newParticipant.clientId)) {
              return prev;
            }
            return [...prev, newParticipant];
          });

          optionsRef.current.onParticipantJoined?.(newParticipant);
        }
        break;

      case 'peer-left':
        if (message.data?.clientId) {
          setParticipants((prev) =>
            prev.filter((p) => p.clientId !== message.data.clientId)
          );
          optionsRef.current.onParticipantLeft?.(message.data.clientId);
        }
        break;

      case 'error':
        console.error('[WS] Server error:', message.data?.error);
        optionsRef.current.onError?.(new Error(message.data?.error || 'Unknown error'));
        break;

      case 'pong':
        // heartbeat response
        break;

      default:
        console.log('[WS] Unhandled message type:', message.type);
    }
  }, []);

  // initialize WebSocket client
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:4002/ws';

    console.log('[useWebSocket] Initializing WebSocket client');

    const client = new WebSocketClient({
      url: wsUrl,
      token: options.token,
      onMessage: handleMessage,
      onConnect: () => {
        console.log('[useWebSocket] Connected');
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('[useWebSocket] Disconnected');
        setIsConnected(false);
      },
      onError: (error) => {
        console.error('[useWebSocket] Error:', error);
        optionsRef.current.onError?.(error);
      },
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
    });

    wsClientRef.current = client;
    client.connect();

    // cleanup on unmount
    return () => {
      console.log('[useWebSocket] Cleaning up');
      client.disconnect();
      wsClientRef.current = null;
    };
  }, [options.token, handleMessage]);

  const joinSession = useCallback((sessionId: string, isHost: boolean) => {
    if (wsClientRef.current) {
      console.log('[useWebSocket] Joining session:', sessionId, 'as', isHost ? 'host' : 'participant');
      wsClientRef.current.joinSession(sessionId, isHost);
    }
  }, []);

  const leaveSession = useCallback(() => {
    if (wsClientRef.current) {
      console.log('[useWebSocket] Leaving session');
      wsClientRef.current.leaveSession();
      setParticipants([]);
    }
  }, []);

  const sendOffer = useCallback((to: string, offer: RTCSessionDescriptionInit) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendOffer(to, offer);
    }
  }, []);

  const sendAnswer = useCallback((to: string, answer: RTCSessionDescriptionInit) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendAnswer(to, answer);
    }
  }, []);

  const sendIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendIceCandidate(to, candidate);
    }
  }, []);

  return {
    wsClient: wsClientRef.current,
    isConnected,
    clientId,
    participants,
    joinSession,
    leaveSession,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}