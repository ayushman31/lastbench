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



// Upload client utilities

class UploadClient {

  private baseUrl: string;



  constructor(baseUrl: string = 'http://localhost:4001') {

    this.baseUrl = baseUrl;

  }



  async initUpload(params: {

    userId: string;

    recordingId: string;

    filename: string;

    mimeType: string;

    totalSize: number;

  }) {

    const response = await fetch(`${this.baseUrl}/api/upload/init`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(params),

    });



    if (!response.ok) throw new Error('Failed to init upload');

    return response.json();

  }



  async uploadChunk(params: {

    sessionId: string;

    chunkIndex: number;

    chunk: Blob;

    totalChunks: number;

  }) {

    const formData = new FormData();

    formData.append('chunk', params.chunk);

    formData.append('sessionId', params.sessionId);

    formData.append('chunkIndex', String(params.chunkIndex));

    formData.append('totalChunks', String(params.totalChunks));

   



    const response = await fetch(`${this.baseUrl}/api/upload/chunk`, {

      method: 'POST',

      body: formData,

    });



    if (!response.ok) throw new Error('Failed to upload chunk');

    return response.json();

  }



  async completeUpload(sessionId: string) {

    const response = await fetch(`${this.baseUrl}/api/upload/complete`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ sessionId }),

    });



    if (!response.ok) throw new Error('Failed to complete upload');

    return response.json();

  }

}



export default function RecordingPage() {

  const recorderRef = useRef<LocalRecorder | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);

  const animationRef = useRef<number | null>(null);

  const uploadClientRef = useRef(new UploadClient());



  const [state, setState] = useState<RecordingState>({

    status: 'idle',

    duration: 0,

    dataSize: 0,

  });



  const [mediaUrl, setMediaUrl] = useState('');

  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);

  const [audioLevel, setAudioLevel] = useState(0);

  const [error, setError] = useState('');

  const [isUploading, setIsUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);



  // Cleanup on unmount

  useEffect(() => {

    return () => {

      cleanup();

    };

  }, []);



  const cleanup = () => {

    // Stop recorder

    if (recorderRef.current) {

      recorderRef.current.dispose();

      recorderRef.current = null;

    }



    // Revoke media URL

    if (mediaUrl) {

      URL.revokeObjectURL(mediaUrl);

    }



    // Stop audio analysis

    if (animationRef.current) {

      cancelAnimationFrame(animationRef.current);

    }



    // Close audio context

    if (audioContextRef.current) {

      audioContextRef.current.close();

    }



    // Stop preview stream

    if (previewVideoRef.current?.srcObject) {

      const stream = previewVideoRef.current.srcObject as MediaStream;

      stream.getTracks().forEach((track) => track.stop());

      previewVideoRef.current.srcObject = null;

    }

  };



  const initializeRecorder = async () => {

    if (recorderRef.current) return;



    try {

      // Create recorder

      const recorder = new LocalRecorder({

        audio: true,

        video: true,

      });



      // Initialize and get stream

      await recorder.initialize();

      const stream = recorder.getStream();



      if (!stream) {

        throw new Error('Failed to get media stream');

      }



      // Setup video preview

      if (previewVideoRef.current) {

        previewVideoRef.current.srcObject = stream;

      }



      // Setup audio level meter

      setupAudioMeter(stream);



      // Subscribe to recorder events

      recorder.on((event) => {

        console.log('Recording event:', event.type);



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



  const setupAudioMeter = (stream: MediaStream) => {

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

        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        const normalizedLevel = Math.min((avg / 128) * 100, 100);

        setAudioLevel(normalizedLevel);



        animationRef.current = requestAnimationFrame(updateMeter);

      };



      updateMeter();

    } catch (err) {

      console.error('Audio meter setup failed:', err);

    }

  };



  const handleStart = async () => {

    try {

      setError('');

      await initializeRecorder();

      await recorderRef.current?.start();

    } catch (err) {

      setError(`Failed to start: ${(err as Error).message}`);

    }

  };



  const handlePause = () => {

    try {

      recorderRef.current?.pause();

    } catch (err) {

      setError(`Failed to pause: ${(err as Error).message}`);

    }

  };



  const handleResume = () => {

    try {

      recorderRef.current?.resume();

    } catch (err) {

      setError(`Failed to resume: ${(err as Error).message}`);

    }

  };



  const handleStop = async () => {

    try {

      const blob = await recorderRef.current?.stop();



      if (blob) {

        console.log('Recording stopped:', {

          type: blob.type,

          size: formatBytes(blob.size),

        });



        const url = URL.createObjectURL(blob);

        setMediaUrl(url);



        // Set playback source

        if (playbackVideoRef.current) {

          playbackVideoRef.current.src = url;

        }



        // Stop preview

        if (previewVideoRef.current?.srcObject) {

          const stream = previewVideoRef.current.srcObject as MediaStream;

          stream.getTracks().forEach((track) => track.stop());

          previewVideoRef.current.srcObject = null;

        }

      }

    } catch (err) {

      setError(`Failed to stop: ${(err as Error).message}`);

    }

  };



  const handleUpload = async () => {

    if (!mediaUrl || !metadata) return;



    try {

      setIsUploading(true);

      setUploadProgress(0);

      setError('');



      // Fetch blob from URL

      const blob = await fetch(mediaUrl).then((r) => r.blob());



      // Initialize upload session

      const ext = getExtensionFromMimeType((metadata.metadata as { mimeType: string }).mimeType);

      const filename = generateFilename('recording', ext);

     

     

      console.log("metadata", metadata);

     



      const uploadSession = await uploadClientRef.current.initUpload({

        userId: 'user-123', // Replace with actual user ID

        recordingId: 'rec-' + Date.now(),

        filename,

        mimeType: (metadata.metadata as { mimeType: string }).mimeType,

        totalSize: blob.size,

      });



      console.log('Upload session created:', uploadSession);



      const { sessionId, chunkSize, totalChunks } = uploadSession;



      // Upload chunks

      for (let i = 0; i < totalChunks; i++) {

        const start = i * chunkSize;

        const end = Math.min(start + chunkSize, blob.size);

        const chunk = blob.slice(start, end);

       

        await uploadClientRef.current.uploadChunk({

          sessionId,

          chunkIndex: i,

          chunk,

          totalChunks,

        });



        console.log("Uploaded chunk", i + 1, "of", totalChunks);



        const progress = ((i + 1) / totalChunks) * 100;

        setUploadProgress(Math.round(progress));

        console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);

      }



      // Complete upload

      const result = await uploadClientRef.current.completeUpload(sessionId);

      console.log('Upload completed:', result);



      alert(`Upload successful! URL: ${result.url}`);

    } catch (err) {

      setError(`Upload failed: ${(err as Error).message}`);

      console.error('Upload error:', err);

    } finally {

      setIsUploading(false);

    }

  };



  const handleDownload = async () => {

    if (!mediaUrl || !metadata) return;

    const ext = getExtensionFromMimeType(metadata.mimeType);

    const filename = generateFilename('recording', ext);

    const blob = await fetch(mediaUrl).then((r) => r.blob());

    downloadBlob(blob, filename);

  };



  return (

    <div className="p-8 max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">Recording Studio</h1>



      {/* Error Display */}

      {error && (

        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">

          <strong>Error:</strong> {error}

        </div>

      )}



      {/* Recording Info */}

      <div className="bg-white shadow rounded-lg p-4 mb-4">

        <div className="grid grid-cols-3 gap-4 text-center">

          <div>

            <div className="text-sm text-gray-600">Status</div>

            <div className="text-lg font-semibold capitalize">{state.status}</div>

          </div>

          <div>

            <div className="text-sm text-gray-600">Duration</div>

            <div className="text-lg font-mono font-semibold">

              {formatDuration(state.duration)}

            </div>

          </div>

          <div>

            <div className="text-sm text-gray-600">Size</div>

            <div className="text-lg font-semibold">

              {formatBytes(state.dataSize)}

            </div>

          </div>

        </div>

      </div>



      {/* Video Preview (during recording) */}

      {state.status !== 'idle' && state.status !== 'stopped' && (

        <div className="mb-4">

          <h2 className="text-xl font-semibold mb-2">Live Preview</h2>

          <video

            ref={previewVideoRef}

            autoPlay

            muted

            playsInline

            className="w-full rounded-lg bg-black shadow-lg"

          />



          {/* Audio Level Meter */}

          <div className="mt-3">

            <div className="text-sm text-gray-600 mb-1">

              Audio Level: {Math.round(audioLevel)}%

            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

              <div

                className={`h-4 transition-all duration-100 ${

                  audioLevel > 80

                    ? 'bg-red-500'

                    : audioLevel > 50

                    ? 'bg-yellow-500'

                    : 'bg-green-500'

                }`}

                style={{ width: `${Math.min(audioLevel, 100)}%` }}

              />

            </div>

          </div>

        </div>

      )}



      {/* Recording Controls */}

      <div className="flex gap-3 mb-6">

        <button

          onClick={handleStart}

          disabled={state.status !== 'idle'}

          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition"

        >

          ● Start Recording

        </button>



        <button

          onClick={handlePause}

          disabled={state.status !== 'recording'}

          className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-700 transition"

        >

          ⏸ Pause

        </button>



        <button

          onClick={handleResume}

          disabled={state.status !== 'paused'}

          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"

        >

          ▶ Resume

        </button>



        <button

          onClick={handleStop}

          disabled={state.status !== 'recording' && state.status !== 'paused'}

          className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"

        >

          ■ Stop

        </button>

      </div>



      {/* Playback Section */}

      {mediaUrl && (

        <div className="bg-white shadow-lg rounded-lg p-6">

          <h2 className="text-xl font-semibold mb-4">Recording Playback</h2>



          <video

            ref={playbackVideoRef}

            controls

            className="w-full rounded-lg bg-black mb-4"

          />



          {metadata && (

            <div className="bg-gray-50 rounded p-3 mb-4 text-sm">

              <div className="grid grid-cols-2 gap-2">

                <div>

                  <span className="font-semibold">MIME Type:</span>{' '}

                  {metadata.mimeType}

                </div>

                <div>

                  <span className="font-semibold">Duration:</span>{' '}

                  {formatDuration(metadata.duration)}

                </div>

                <div>

                  <span className="font-semibold">Size:</span>{' '}

                  {formatBytes(metadata.dataSize)}

                </div>

                {metadata.codec && (

                  <div>

                    <span className="font-semibold">Codec:</span> {metadata.codec}

                  </div>

                )}

                <div>

                  <span className="font-semibold">Audio Tracks:</span>{' '}

                  {metadata.audioTracks}

                </div>

                <div>

                  <span className="font-semibold">Video Tracks:</span>{' '}

                  {metadata.videoTracks}

                </div>

              </div>

            </div>

          )}



          {/* Upload Progress */}

          {isUploading && (

            <div className="mb-4">

              <div className="text-sm text-gray-600 mb-1">

                Uploading... {uploadProgress}%

              </div>

              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

                <div

                  className="h-3 bg-blue-500 transition-all"

                  style={{ width: `${uploadProgress}%` }}

                />

              </div>

            </div>

          )}



          {/* Action Buttons */}

          <div className="flex gap-3">

            <button

              onClick={handleDownload}

              disabled={isUploading}

              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"

            >

              ⬇ Download

            </button>



            <button

              onClick={handleUpload}

              disabled={isUploading}

              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"

            >

              {isUploading ? 'Uploading...' : '☁ Upload to Storage'}

            </button>

          </div>

        </div>

      )}

    </div>

  );

}