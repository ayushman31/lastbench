'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LocalRecorder,
  formatDuration,
  formatBytes,
  downloadBlob,
  generateFilename,
  getExtensionFromMimeType,
  type RecordingState,
  type RecordingMetadata,
  type RecordingError,
} from '@repo/recording-engine';

export default function RecordingPage() {
  const recorderRef = useRef<LocalRecorder | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelRef = useRef<number>(0);

  const [state, setState] = useState<RecordingState>({
    status: 'idle',
    duration: 0,
    dataSize: 0,
  });

  const [mediaUrl, setMediaUrl] = useState('');
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      recorderRef.current?.dispose();
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const initializeRecorder = async () => {
    if (recorderRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Preview
    if (previewRef.current) {
      previewRef.current.srcObject = stream;
    }

    // Audio level meter
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg =
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      audioLevelRef.current = avg;
      setAudioLevel(avg);
      requestAnimationFrame(updateMeter);
    };

    updateMeter();

    const recorder = new LocalRecorder({ audio: true, video: true });

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
  };

  const handleStart = async () => {
    setError('');
    await initializeRecorder();
    await recorderRef.current?.start();
  };

  const handleStop = async () => {
    const blob = await recorderRef.current?.stop();
    console.log("⭕⭕⭕");
    
    console.log(blob?.type);
    if (blob) setMediaUrl(URL.createObjectURL(blob));
  };

  const handleDownload = async () => {
    if (!mediaUrl || !metadata) return;
    const ext = getExtensionFromMimeType(metadata.mimeType);
    const filename = generateFilename('recording', ext);
    const blob = await fetch(mediaUrl).then((r) => r.blob());
    downloadBlob(blob, filename);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Recording</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Preview */}
      <video
        ref={previewRef}
        autoPlay
        muted
        playsInline
        className="w-full mb-4 rounded bg-black"
      />

      {/* Audio Level */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Audio Level</div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div
            className="h-3 bg-green-500 rounded transition-all"
            style={{ width: `${Math.min(audioLevel, 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStart}
          disabled={state.status !== 'idle'}
          className="px-6 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={state.status !== 'recording'}
          className="px-6 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      {/* Playback */}
      {mediaUrl && (
        <div className="bg-white shadow rounded p-4">
          <video src={mediaUrl} controls className="w-full mb-3" />
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}
