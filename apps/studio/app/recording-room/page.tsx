'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
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

export default function RecordingPage() {
  const [appState, setAppState] = useState<'permissions' | 'lobby' | 'studio'>('permissions');

  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[], video: MediaDeviceInfo[] }>({ audio: [], video: [] });

  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedCam, setSelectedCam] = useState<string>('');

  const [activeStream, setActiveStream] =
    useState<MediaStream | null>(null);

  const recorderRef = useRef<LocalRecorder | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const uploadClient = useMemo(() => new UploadClient(), []);

  const [recState, setRecState] = useState<RecordingState>({ status: 'idle', duration: 0, dataSize: 0 });

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
    setAudioLevel: () => {}, // will be used by audio meter UI elsewhere
    setMediaUrl,
    setIsUploading,
    setUploadProgress,
    setIsMicMuted,
    setIsCamOff,
  };

  useEffect(() => {
    checkPermissions();
    return () => cleanup(mediaUrl, deps);
  }, []);

  const checkPermissions = async () => {
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
  };

  const startStream = async (micId?: string, camId?: string) => {
    activeStream?.getTracks().forEach((t) => t.stop());

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: micId ? { deviceId: { exact: micId } } : true,
      video: camId ? { deviceId: { exact: camId } } : true,
    });

    setActiveStream(stream);
    setIsMicMuted(false);
    setIsCamOff(false);
  };

  useEffect(() => {
    if (appState === 'lobby') {
      startStream(selectedMic, selectedCam);
    }
  }, [selectedMic, selectedCam]);

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
            onJoin={() => setAppState('studio')}
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
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            onLeave={() => window.location.reload()}
            onSettings={() => setAppState('lobby')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
