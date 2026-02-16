'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useSession } from '@repo/auth/client';
import {
  type RecordingState,
  type RecordingMetadata,
  LocalRecorder,
} from '@repo/recording-engine';

import {
  cleanup,
  handleStart,
  handlePause,
  handleResume,
  handleStop,
  handleUpload,
  handleDownload,
  toggleMic,
  toggleCam,
  type RecorderDeps,
} from '@/utils/utils';

import { UploadClient } from '@/lib/uploadClient';
import { PermissionsScreen } from '@/components/screens/PermissionsScreen';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { StudioScreen } from '@/components/screens/StudioScreen';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { Participant, CreateSessionResponse, SignalingMessage } from '@/lib/types';

export default function RecordingPage() {
  const searchParams = useSearchParams();
  const { session: authSession, user } = useSession();

  // URL params for guest/host detection
  const urlToken = searchParams.get('token');
  const urlGuestName = searchParams.get('guestName');
  const urlSessionId = searchParams.get('sessionId');

  const isGuest = !!urlToken;
  const isHost = !isGuest && !!authSession;
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/17e2719f-0303-4a68-9210-85c9d0b52f60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:MOUNT',message:'Component mounted',data:{urlToken,urlGuestName,isGuest,isHost,hasAuthSession:!!authSession},timestamp:Date.now(),hypothesisId:'B,C'})}).catch(()=>{});
  }, []);
  // #endregion

  const [appState, setAppStateRaw] = useState<'permissions' | 'lobby' | 'studio'>('permissions');
  
  // Wrap setAppState to log all state changes
  const setAppState = useCallback((newState: 'permissions' | 'lobby' | 'studio') => {
    setAppStateRaw(newState);
  }, [appState]);
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [guestName, setGuestName] = useState<string>(urlGuestName || '');
  const [guestNameCollected, setGuestNameCollected] = useState<boolean>(!!urlGuestName);
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const hasCheckedPermissionsRef = useRef(false);

  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[], video: MediaDeviceInfo[] }>({ 
    audio: [], 
    video: [] 
  });

  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedCam, setSelectedCam] = useState<string>('');

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // Remote participant streams
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const recorderRef = useRef<LocalRecorder | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const uploadClient = useMemo(() => new UploadClient(), []);

  const [recState, setRecState] = useState<RecordingState>({ 
    status: 'idle', 
    duration: 0, 
    dataSize: 0 
  });

  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const deps: RecorderDeps = {
    recorderRef,
    previewVideoRef,
    playbackVideoRef,
    audioContextRef,
    analyserRef,
    animationRef,
    uploadClient,
    setState: setRecState,
    setMetadata,
    setError,
    setAudioLevel: () => {},
    setMediaUrl,
    setIsUploading,
    setUploadProgress,
    setIsMicMuted,
    setIsCamOff,
  };

  // WebSocket connection
  const {
    isConnected,
    clientId,
    participants,
    joinSession: wsJoinSession,
    leaveSession: wsLeaveSession,
    wsClient,
  } = useWebSocket({
    token: urlToken || undefined,
    onParticipantJoined: (participant) => {
      console.log('[App] Participant joined:', participant);
    },
    onParticipantLeft: (clientId) => {
      console.log('[App] Participant left:', clientId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(clientId);
        return next;
      });
    },
    onError: (error) => {
      console.error('[App] WebSocket error:', error);
      if (error.message.includes('Failed to reconnect') || error.message.includes('Max reconnection')) {
        setError(error.message);
      }
    },
  });

    // Clear error when WebSocket connects successfully
    useEffect(() => {
      if (isConnected && error.includes('WebSocket')) {
        setError('');
      }
    }, [isConnected]);

  // WebRTC peer connections
  const { 
    createOffer, 
    handleOffer, 
    handleAnswer, 
    handleIceCandidate,
    closePeerConnection 
  } = useWebRTC({
    localStream: activeStream,
    clientId,
    participants,
    onMessage: (message: SignalingMessage) => {
      wsClient?.send(message);
    },
    onStreamAdded: (clientId: string, stream: MediaStream) => {
      console.log('[App] Remote stream added:', clientId);
      setRemoteStreams((prev) => new Map(prev).set(clientId, stream));
    },
    onStreamRemoved: (clientId: string) => {
      console.log('[App] Remote stream removed:', clientId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(clientId);
        return next;
      });
    },
  });

  // Handle WebRTC signaling messages (combined with useWebSocket handler)
  useEffect(() => {
    if (!wsClient) return;

    // Get the original handler from useWebSocket
    const originalHandler = wsClient['onMessageHandler'];

    const combinedHandler = (message: SignalingMessage) => {
      // First, call the original handler from useWebSocket (for session-update, peer-joined, etc.)
      if (originalHandler) {
        originalHandler(message);
      }

      // Then, handle WebRTC-specific messages
      switch (message.type) {
        case 'offer':
          if (message.from && message.data) {
            handleOffer(message.from, message.data);
          }
          break;

        case 'answer':
          if (message.from && message.data) {
            handleAnswer(message.from, message.data);
          }
          break;

        case 'ice-candidate':
          if (message.from && message.data) {
            handleIceCandidate(message.from, message.data);
          }
          break;

        case 'peer-joined':
          // When a new peer joins, create an offer if we're already in the session
          if (message.from && appState === 'studio') {
            setTimeout(() => {
              createOffer(message.from!);
            }, 1000);
          }
          break;

        case 'peer-left':
          if (message.data?.clientId) {
            closePeerConnection(message.data.clientId);
          }
          break;
      }
    };

    wsClient.setMessageHandler(combinedHandler);
  }, [wsClient, handleOffer, handleAnswer, handleIceCandidate, createOffer, closePeerConnection, appState]);

  // Initial permissions check
  useEffect(() => {
    checkPermissions();
    return () => cleanup(mediaUrl, deps);
  }, []);

  const checkPermissions = async () => {
    // Prevent duplicate calls from React Strict Mode
    if (hasCheckedPermissionsRef.current) {
      console.log('[App] Permissions already checked, skipping');
      return;
    }
    hasCheckedPermissionsRef.current = true;
    
    try {
      const test = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      test.getTracks().forEach((t) => t.stop());

      setAppState('lobby');

      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audio: all.filter((d) => d.kind === 'audioinput'),
        video: all.filter((d) => d.kind === 'videoinput'),
      });

      setSelectedMic(all?.filter((d) => d.kind === 'audioinput')[0]?.deviceId || '');
      setSelectedCam(all?.filter((d) => d.kind === 'videoinput')[0]?.deviceId || '');
    } catch (error) {
      console.error('Permission error:', error);
      setError('Camera/Microphone permissions denied');
    }
  };

  const startStream = async (micId?: string, camId?: string) => {
    try {
      activeStream?.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
        video: camId ? { deviceId: { exact: camId } } : true,
      });

      console.log('[App] Stream started:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      setActiveStream(stream);
      setIsMicMuted(false);
      setIsCamOff(false);
    } catch (error) {
      console.error('[App] Failed to start stream:', error);
      setError('Failed to access camera/microphone');
    }
  };
  useEffect(() => {
    if (appState === 'lobby' && selectedMic && selectedCam) {
      startStream(selectedMic, selectedCam);
    }
  }, [selectedMic, selectedCam, appState]);

  // Create session for host
  const createSession = async () => {
    if (!authSession?.user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://localhost:4002';
      const response = await fetch(`${apiUrl}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: authSession.user.id,
          hostName: authSession.user.name || authSession.user.email,
          title: `${authSession.user.name || 'Anonymous'}'s Recording Session`,
          maxGuests: 5,
          expiresInHours: 24,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data: CreateSessionResponse = await response.json();
      
      setSessionId(data.session.id);
      setInviteLink(data.inviteLink);
      setShowInviteLinkModal(true);

      console.log('[App] Session created:', data.session.id);
    } catch (error) {
      console.error('[App] Failed to create session:', error);
      setError('Failed to create recording session');
    }
  };

  // Handle join studio button
  const handleJoinStudio = async () => {
    console.log('[App] Handle join studio:', { isHost, isGuest, sessionId, guestName });
    
    if (isHost && !sessionId) {
      // Host needs to create session first
      await createSession();
    } else if (isGuest && !guestName) {
      // Guest needs to provide name first (modal will handle this)
      console.log('[App] Guest needs to provide name');
      return;
    } else if (!sessionId) {
      console.error('[App] No session ID available');
      setError('Session not found');
      return;
    } else {
      // Ready to join
      proceedToStudio();
    }
  };

  const proceedToStudio = () => {
    console.log('[App] Proceed to studio:', { sessionId, isConnected, isHost, isGuest });

    if (hasJoinedSession) {
      console.log('[App] Already joined session, skipping');
      setAppState('studio');
      return;
    }

    
    if (!sessionId) {
      console.error('[App] Cannot proceed: No session ID');
      setError('Session not found');
      return;
    }

    if (!isConnected) {
      console.error('[App] Cannot proceed: WebSocket not connected');
      setError('Connecting to server...');
      // Retry after a delay
      setTimeout(() => {
        if (isConnected && sessionId) {
          proceedToStudio();
        }
      }, 1000);
      return;
    }

    console.log('[App] Joining session:', sessionId);
    wsJoinSession(sessionId, isHost);
    setHasJoinedSession(true); // Set this FIRST to prevent useEffect retrigger
    setAppState('studio'); // Then change state
  };

    // Fetch session ID from invite token for guests
    useEffect(() => {
      const fetchGuestSession = async () => {
        if (isGuest && urlToken && !sessionId) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://localhost:4002';
            const response = await fetch(`${apiUrl}/api/sessions/invite/${urlToken}`);
            
            if (!response.ok) {
              throw new Error('Invalid or expired invite link');
            }
            
            const data = await response.json();
            setSessionId(data.id);
            console.log('[App] Guest session ID fetched:', data.id);
          } catch (error) {
            console.error('[App] Failed to fetch guest session:', error);
            setError('Failed to load session. Please check your invite link.');
          }
        }
      };
  
      fetchGuestSession();
    }, [isGuest, urlToken, sessionId]);

  // Auto-proceed to studio after session creation modal is closed
  useEffect(() => {
    if (!showInviteLinkModal && sessionId && appState === 'lobby' && isHost && !hasJoinedSession) {
      proceedToStudio();
    }
  }, [showInviteLinkModal, sessionId, appState, isHost, isConnected, hasJoinedSession]);

  // For guests, join session when they enter studio
  // useEffect(() => {
  //   if (isGuest && sessionId && appState === 'studio' && isConnected && guestName) {
  //     wsJoinSession(sessionId, false);
  //   }
  // }, [isGuest, sessionId, appState, isConnected, guestName]);


  const handleGuestNameSubmit = (name: string) => {
    setGuestName(name);
    setGuestNameCollected(true);
    console.log('[App] Guest name submitted:', name);
  };

  const handleDiscardRecording = () => {
    setMediaUrl('');
    setMetadata(null);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.src = '';
    }
  };

  const handleLeaveStudio = () => {
    wsLeaveSession();
    
    // Close all peer connections
    remoteStreams.forEach((_, clientId) => {
      closePeerConnection(clientId);
    });
    setRemoteStreams(new Map());
    
    window.location.reload();
  };

    // Combine local and remote participants
    const allParticipants: Participant[] = useMemo(() => {
      console.log('[App] Computing participants:', {
        clientId,
        activeStream: !!activeStream,
        audioTracks: activeStream?.getAudioTracks().length || 0,
        videoTracks: activeStream?.getVideoTracks().length || 0,
        remoteParticipants: participants.length,
        guestName,
        authUser: authSession?.user?.name,
      });
      const allParts: Participant[] = [];
  
      // Always add local user with their stream (even if not connected to WebSocket yet)
      const localUserName = isGuest 
        ? guestName 
        : (authSession?.user?.name || authSession?.user?.email || 'You');
  
      if (localUserName && activeStream) {
        allParts.push({
          clientId: clientId || 'local', // Use 'local' as fallback
          userId: isGuest ? 'guest' : (authSession?.user?.id || ''),
          userName: localUserName,
          isHost,
          isGuest,
          stream: activeStream || undefined,
        });
        console.log('[App] Added local participant:', localUserName);
      }
  
      // Add remote participants (only if we have a clientId, meaning we're connected)
      if (clientId) {
        participants.forEach((p) => {
          // Don't add if it's the same as our clientId (avoid duplicate)
          if (p.clientId !== clientId) {
            const remoteStream = remoteStreams.get(p.clientId);
           
            allParts.push({
              ...p,
              stream: remoteStream,
            });
            console.log('[App] Added remote participant:', p.userName);
          }
        });
      }
  
      console.log('[App] All participants:', allParts.length, allParts.map(p => ({ name: p.userName, hasStream: !!p.stream })));
      return allParts;
    }, [clientId, participants, remoteStreams, activeStream, isHost, isGuest, guestName, authSession]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {appState === 'permissions' && (
          <PermissionsScreen onAllow={checkPermissions} />
        )}

        {appState === 'lobby' && (
          <LobbyScreen
            stream={activeStream}
            devices={devices}
            selectedMic={selectedMic}
            setSelectedMic={setSelectedMic}
            selectedCam={selectedCam}
            setSelectedCam={setSelectedCam}
            onJoin={handleJoinStudio}
            isGuest={isGuest}
            guestName={guestName}
            onGuestNameSubmit={handleGuestNameSubmit}
            inviteLink={inviteLink}
            showInviteLinkModal={showInviteLinkModal}
            onCloseInviteLinkModal={() => setShowInviteLinkModal(false)}
          />
        )}

        {appState === 'studio' && (
          <StudioScreen
            stream={activeStream}
            recState={recState}
            recordedUrl={mediaUrl}
            isMicMuted={isMicMuted}
            toggleMic={() =>
              toggleMic(activeStream, isMicMuted, setIsMicMuted)
            }
            isCamOff={isCamOff}
            toggleCam={() =>
              toggleCam(activeStream, isCamOff, setIsCamOff)
            }
            startRecording={() => handleStart(deps)}
            pauseRecording={() => handlePause(deps)}
            resumeRecording={() => handleResume(deps)}
            stopRecording={() => handleStop(deps)}
            onUpload={() =>
              metadata && handleUpload(mediaUrl, metadata, deps)
            }
            onDownload={() =>
              metadata && handleDownload(mediaUrl, metadata)
            }
            onDiscardRecording={handleDiscardRecording}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            onLeave={handleLeaveStudio}
            onSettings={() => setAppState('lobby')}
            isGuest={isGuest}
            participants={allParticipants}
            userName={isGuest ? guestName : (authSession?.user?.name || authSession?.user?.email || 'You')}
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive/90 text-destructive-foreground px-4 py-3 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}