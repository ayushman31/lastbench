import { UploadClient } from '@/lib/uploadClient';
import {
  LocalRecorder,
  formatBytes,
  getExtensionFromMimeType,
  generateFilename,
  downloadBlob,
  type RecordingMetadata,
  type RecordingError,
  type RecordingState,
} from '@repo/recording-engine';


export type RecorderDeps = {
  recorderRef: React.RefObject<LocalRecorder | null>;
  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  playbackVideoRef: React.RefObject<HTMLVideoElement | null>;
  audioContextRef: React.RefObject<AudioContext | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  animationRef: React.RefObject<number | null>;
  uploadClient: UploadClient;

  setState: (s: RecordingState) => void;
  setMetadata: (m: RecordingMetadata | null) => void;
  setError: (e: string) => void;
  setAudioLevel: (n: number) => void;
  setMediaUrl: (u: string) => void;
  setIsUploading: (v: boolean) => void;
  setUploadProgress: (n: number) => void;
  setIsMicMuted: (v: boolean) => void;
  setIsCamOff: (v: boolean) => void;
};

export const cleanup = (
  mediaUrl: string,
  {
    recorderRef,
    previewVideoRef,
    audioContextRef,
    animationRef,
  }: RecorderDeps
) => {
  if (recorderRef.current) {
    recorderRef.current.dispose();
    recorderRef.current = null;
  }

  if (mediaUrl) {
    URL.revokeObjectURL(mediaUrl);
  }

  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }

  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }

  if (previewVideoRef.current?.srcObject) {
    const stream = previewVideoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach((t) => t.stop());
    previewVideoRef.current.srcObject = null;
  }
};

export const setupAudioMeter = (
  stream: MediaStream,
  { audioContextRef, analyserRef, animationRef, setAudioLevel }: RecorderDeps
) => {
  try {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      const avg =
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      setAudioLevel(Math.min((avg / 128) * 100, 100));
      animationRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  } catch (err) {
    console.error('Audio meter setup failed:', err);
  }
};

export const initializeRecorder = async (deps: RecorderDeps) => {
  const {
    recorderRef,
    previewVideoRef,
    setState,
    setMetadata,
    setError,
  } = deps;

  if (recorderRef.current) return;

  try {
    const recorder = new LocalRecorder({ audio: true, video: true });
    await recorder.initialize();

    const stream = recorder.getStream();
    if (!stream) throw new Error('Failed to get media stream');

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = stream;
    }

    setupAudioMeter(stream, deps);

    recorder.on((event) => {
      switch (event.type) {
        case 'state-changed':
          setState(recorder.getState());
          break;

        case 'stopped':
          setMetadata(event.data as RecordingMetadata);
          break;

        case 'error':
          setError((event.data as RecordingError).message);
          break;
      }
    });

    recorderRef.current = recorder;
  } catch (err) {
    setError((err as Error).message);
    throw err;
  }
};

export const handleStart = async (deps: RecorderDeps) => {
  try {
    deps.setError('');
    await initializeRecorder(deps);
    await deps.recorderRef.current?.start();
  } catch (err) {
    deps.setError(`Failed to start: ${(err as Error).message}`);
  }
};

export const handlePause = (deps: RecorderDeps) => {
  try {
    deps.recorderRef.current?.pause();
  } catch (err) {
    deps.setError(`Failed to pause: ${(err as Error).message}`);
  }
};

export const handleResume = (deps: RecorderDeps) => {
  try {
    deps.recorderRef.current?.resume();
  } catch (err) {
    deps.setError(`Failed to resume: ${(err as Error).message}`);
  }
};

export const handleStop = async (deps: RecorderDeps): Promise<{ blob: Blob; url: string } | null> => {
  try {
    const blob = await deps.recorderRef.current?.stop();
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    deps.setMediaUrl(url);

    if (deps.playbackVideoRef.current) {
      deps.playbackVideoRef.current.src = url;
    }

    if (deps.previewVideoRef.current?.srcObject) {
      const stream = deps.previewVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      deps.previewVideoRef.current.srcObject = null;
    }
    
    return { blob, url };
  } catch (err) {
    deps.setError(`Failed to stop: ${(err as Error).message}`);
    return null;
  }
};

export const handleUpload = async (
  mediaUrl: string,
  metadata: RecordingMetadata,
  deps: RecorderDeps
) => {
  if (!mediaUrl || !metadata) return;

  try {
    deps.setIsUploading(true);
    deps.setUploadProgress(0);
    deps.setError('');

    const blob = await fetch(mediaUrl).then((r) => r.blob());

    const ext = getExtensionFromMimeType(
      (metadata.metadata as { mimeType: string }).mimeType
    );

    const filename = generateFilename('recording', ext);

    const uploadSession = await deps.uploadClient.initUpload({
      userId: 'user-123',
      recordingId: 'rec-' + Date.now(),
      filename,
      mimeType: (metadata.metadata as { mimeType: string }).mimeType,
      totalSize: blob.size,
    });

    const { sessionId, chunkSize, totalChunks } = uploadSession;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = blob.slice(
        i * chunkSize,
        Math.min(blob.size, (i + 1) * chunkSize)
      );

      await deps.uploadClient.uploadChunk({
        sessionId,
        chunkIndex: i,
        chunk,
        totalChunks,
      });

      deps.setUploadProgress( Math.round(((i + 1) / totalChunks) * 100));
    }

    await deps.uploadClient.completeUpload(sessionId);
    alert('Upload successful');
  } catch (err) {
    deps.setError(`Upload failed: ${(err as Error).message}`);
  } finally {
    deps.setIsUploading(false);
  }
};

export const handleDownload = async (mediaUrl: string, metadata: RecordingMetadata) => {
  if (!mediaUrl || !metadata) return;

  const ext = getExtensionFromMimeType(metadata.mimeType);
  const filename = generateFilename('recording', ext);
  const blob = await fetch(mediaUrl).then((r) => r.blob());

  downloadBlob(blob, filename);
};

export const toggleMic = (activeStream: MediaStream | null, isMicMuted: boolean, setIsMicMuted: (v: boolean) => void) => {
    if (!activeStream) return;
  
    const nextMuted = !isMicMuted; 
    activeStream
      .getAudioTracks()
      .forEach((t) => (t.enabled = !nextMuted));
  
    setIsMicMuted(nextMuted);
  };
  
  export const toggleCam = ( activeStream: MediaStream | null, isCamOff: boolean, setIsCamOff: (v: boolean) => void) => {
    if (!activeStream) return;
  
    const nextOff = !isCamOff;
  
    activeStream
      .getVideoTracks()
      .forEach((t) => (t.enabled = !nextOff));
  
    setIsCamOff(nextOff);
  };
  