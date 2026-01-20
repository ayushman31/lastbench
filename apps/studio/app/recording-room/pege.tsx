'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Video, VideoOff, Settings, 
  MonitorSpeaker, Play, Square, LogOut, 
  Loader2, CheckCircle2, ChevronDown, Radio,
  UploadCloud, Download, RefreshCw
} from 'lucide-react';
import {
  LocalRecorder,
  formatDuration,
  formatBytes,
  downloadBlob,
  type RecordingState,
  type RecordingMetadata,
} from '@repo/recording-engine';

// --- SHARED UI COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const variants: any = {
    primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
  };
  return (
    <motion.button whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </motion.button>
  );
};

// --- HELPER COMPONENT: STREAM VIDEO (The Fix) ---
// This component ensures the stream is attached to the video element whenever it mounts
const StreamVideo = ({ stream, isMirrored = true, className }: { stream: MediaStream | null, isMirrored?: boolean, className?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className={`${className} ${isMirrored ? 'transform scale-x-[-1]' : ''}`} 
    />
  );
};

// --- HELPER COMPONENT: AUDIO VISUALIZER ---
const AudioVisualizer = ({ stream, className }: { stream: MediaStream | null, className?: string }) => {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    // Check if stream actually has audio tracks
    if (stream.getAudioTracks().length === 0) return;

    try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const update = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setLevel(avg);
            rafRef.current = requestAnimationFrame(update);
        };
        update();
    } catch (e) {
        console.warn("Audio Context Error", e);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  return (
    <div className={`flex items-end ${className}`}>
        <motion.div 
           className="w-full bg-primary rounded-t-sm"
           animate={{ height: `${Math.min(level / 2.55, 100)}%` }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
    </div>
  );
};

// --- SUB-SCREEN: PERMISSIONS ---

const PermissionsScreen = ({ onAllow }: { onAllow: () => void }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
    >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Let's check your setup</h2>
        <p className="text-muted-foreground mb-8">We need access to your camera and microphone.</p>
        <Button onClick={onAllow} className="w-full py-3 text-lg">Allow Access</Button>
    </motion.div>
  </div>
);

// --- SUB-SCREEN: LOBBY ---

const LobbyScreen = ({ 
    stream, devices, 
    selectedMic, setSelectedMic, 
    selectedCam, setSelectedCam, 
    onJoin 
}: any) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-8 items-center justify-center"
        >
            {/* Preview Area */}
            <div className="w-full md:w-1/2 space-y-4">
               <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-2xl ring-1 ring-white/10 group">
                  <StreamVideo stream={stream} className="w-full h-full object-cover" />
                  
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-white">Preview</span>
                  </div>

                  <div className="absolute right-4 bottom-4 h-16 w-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                     <AudioVisualizer stream={stream} className="w-full h-full" />
                  </div>
               </div>
            </div>

            {/* Controls Area */}
            <div className="w-full md:w-[400px] flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Join Studio</h1>
                    <p className="text-muted-foreground">Adjust your settings before entering.</p>
                </div>
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                    <DeviceSelect icon={Mic} label="Microphone" value={selectedMic} options={devices.audio} onChange={setSelectedMic} />
                    <DeviceSelect icon={Video} label="Camera" value={selectedCam} options={devices.video} onChange={setSelectedCam} />
                </div>
                <Button onClick={onJoin} className="w-full h-12 text-lg shadow-primary/25">Join Studio</Button>
            </div>
        </motion.div>
    );
};

const DeviceSelect = ({ icon: Icon, value, options, onChange, label }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-medium text-muted-foreground ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Icon size={16} /></div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-card border border-input rounded-lg py-2.5 pl-10 pr-8 text-sm focus:ring-2 focus:ring-primary outline-none">
        {options.map((opt: any) => <option key={opt.deviceId} value={opt.deviceId}>{opt.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
    </div>
  </div>
);

// --- SUB-SCREEN: STUDIO ---

const StudioScreen = ({
    stream,
    recState,
    isMicMuted, toggleMic,
    isCamOff, toggleCam,
    startRecording, stopRecording,
    pauseRecording, resumeRecording,
    onLeave, onSettings,
    recordedUrl,
    onDiscardRecording,
    onDownload, onUpload, isUploading, uploadProgress
}: any) => {
    
    // Playback logic
    const playbackRef = useRef<HTMLVideoElement>(null);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col h-screen relative bg-zinc-950"
        >
            {/* Header */}
            <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">V</div>
                    <span className="font-medium">Vineeth's Studio</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted uppercase tracking-wider text-muted-foreground">Host</span>
                </div>
                
                {/* Status Indicator */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                     {recState.status === 'recording' ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-mono font-medium text-red-500">{formatDuration(recState.duration)}</span>
                        </div>
                     ) : (
                         <span className="text-xs text-muted-foreground">
                            {recordedUrl ? 'Previewing Recording' : 'Ready to record'}
                         </span>
                     )}
                </div>

                {isUploading ? (
                     <div className="flex items-center gap-3 text-sm">
                        <Loader2 className="animate-spin text-primary" size={16} />
                        <span className="text-muted-foreground">Uploading {uploadProgress}%</span>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={onSettings}><Settings size={18} /></Button>
                )}
            </header>

            {/* Main Stage */}
            <main className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
                {recordedUrl ? (
                    // --- PLAYBACK MODE ---
                    <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-border relative group">
                        <video ref={playbackRef} src={recordedUrl} controls className="w-full h-full" />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button onClick={onDownload} variant="secondary" className="h-9 px-3 text-xs">
                                <Download size={14} className="mr-2"/> Download
                             </Button>
                             <Button onClick={onUpload} variant="primary" className="h-9 px-3 text-xs">
                                <UploadCloud size={14} className="mr-2"/> Upload
                             </Button>
                        </div>
                    </div>
                ) : (
                    // --- LIVE MODE ---
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/5">
                        <StreamVideo 
                            stream={stream} 
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isCamOff ? 'opacity-0' : 'opacity-100'}`} 
                        />
                        
                        {isCamOff && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">V</div>
                             </div>
                        )}

                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                             <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5 text-white font-medium shadow-lg">Vineeth (Host)</div>
                             {isMicMuted && <div className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center text-white"><MicOff size={14} /></div>}
                        </div>
                    </div>
                )}
            </main>

            {/* Controls */}
            <footer className="h-24 flex items-center justify-center px-6 pb-4">
                <div className="flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-2xl">
                    
                    {/* AV Toggles */}
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
                        <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${isMicMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}>
                            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button onClick={toggleCam} className={`p-3 rounded-xl transition-all ${isCamOff ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}>
                            {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                    </div>

                    {/* Recording Controls */}
                    {recordedUrl ? (
                         <Button variant="secondary" onClick={onDiscardRecording}>
                            <RefreshCw size={16} className="mr-2"/> New Recording
                         </Button>
                    ) : (
                        <div className="flex items-center gap-3">
                            {recState.status === 'recording' || recState.status === 'paused' ? (
                                <>
                                    <button onClick={stopRecording} className="h-12 px-6 bg-red-500/20 text-red-500 rounded-xl font-medium border border-red-500/50 flex items-center gap-2">
                                        <Square size={16} fill="currentColor" /> Stop
                                    </button>
                                    <button onClick={recState.status === 'paused' ? resumeRecording : pauseRecording} className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl">
                                        {recState.status === 'paused' ? <Play size={20} /> : <span className="font-bold text-xs">||</span>}
                                    </button>
                                </>
                            ) : (
                                <button onClick={startRecording} className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg flex items-center gap-2">
                                    <div className="w-3 h-3 bg-white rounded-full" /> Record
                                </button>
                            )}
                        </div>
                    )}

                    <div className="border-l border-white/10 pl-4 ml-2">
                         <button onClick={onLeave} className="p-3 rounded-xl hover:bg-red-500/20 text-red-500 transition-all"><LogOut size={20} /></button>
                    </div>
                </div>
            </footer>
        </motion.div>
    );
};

// --- MAIN PAGE CONTAINER ---

export default function RecordingPage() {
  const [appState, setAppState] = useState<'permissions' | 'lobby' | 'studio'>('permissions');
  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[], video: MediaDeviceInfo[] }>({ audio: [], video: [] });
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedCam, setSelectedCam] = useState('');
  
  // State for the ACTIVE stream used in the UI
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // Recorder logic
  const recorderRef = useRef<LocalRecorder | null>(null);
  const [recState, setRecState] = useState<RecordingState>({ status: 'idle', duration: 0, dataSize: 0 });
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkPermissions();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (recorderRef.current) recorderRef.current.dispose();
    if (activeStream) activeStream.getTracks().forEach(t => t.stop());
  };

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(t => t.stop()); // Just checking
      setAppState('lobby');
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices({ audio: audioInputs, video: videoInputs });
      
      if (audioInputs.length) setSelectedMic(audioInputs[0]?.deviceId || '');
      if (videoInputs.length) setSelectedCam(videoInputs[0]?.deviceId || '');

      // Start Lobby Stream
      startStream(audioInputs[0]?.deviceId, videoInputs[0]?.deviceId);
    } catch (err) {
      console.error("Perms failed", err);
    }
  };

  const startStream = async (micId?: string, camId?: string) => {
      // Stop old stream
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: micId ? { exact: micId } : undefined },
        video: { deviceId: camId ? { exact: camId } : undefined, width: 1280, height: 720 }
      });
      setActiveStream(stream);
      setIsMicMuted(false);
      setIsCamOff(false);
  };

  // Switch devices in Lobby
  useEffect(() => {
      if (appState === 'lobby') startStream(selectedMic, selectedCam);
  }, [selectedMic, selectedCam]);

  // --- STUDIO ACTIONS ---

  const enterStudio = async () => {
      // 1. Initialize Recorder
      const recorder = new LocalRecorder({ audio: true, video: true });
      await recorder.initialize();
      
      recorder.on((e) => {
          if (e.type === 'state-changed') setRecState(recorder.getState());
          if (e.type === 'stopped') setMetadata(e.data as RecordingMetadata);
      });
      
      recorderRef.current = recorder;

      // 2. IMPORTANT: Use the recorder's stream as the Active Stream
      // This ensures what we see is exactly what is being recorded
      const recorderStream = recorder.getStream();
      if (recorderStream) {
          setActiveStream(recorderStream);
      }
      
      setAppState('studio');
  };

  const startRecording = async () => await recorderRef.current?.start();
  const pauseRecording = async () => await recorderRef.current?.pause();
  const resumeRecording = async () => await recorderRef.current?.resume();
  
  const stopRecording = async () => {
      const blob = await recorderRef.current?.stop();
      if (blob) setMediaUrl(URL.createObjectURL(blob));
  };

  const discardRecording = () => {
      setMediaUrl('');
      setMetadata(null);
      // Re-initialize studio to ensure fresh stream/recorder
      // We don't need to change appState, just refresh the recorder/stream
      enterStudio(); 
  };

  // Toggles modify the Active Stream directly
  const toggleMic = () => {
      if (activeStream) {
          activeStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
          setIsMicMuted(!isMicMuted);
      }
  };

  const toggleCam = () => {
      if (activeStream) {
          activeStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
          setIsCamOff(!isCamOff);
      }
  };

  const handleUpload = async () => {
      setIsUploading(true);
      // Mock upload logic...
      setTimeout(() => { setIsUploading(false); alert("Uploaded!"); }, 2000);
  };
  
  const handleDownload = async () => {
      if (mediaUrl) {
          const blob = await fetch(mediaUrl).then(r => r.blob());
          downloadBlob(blob, 'recording.webm');
      }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {appState === 'permissions' && (
            <PermissionsScreen key="perm" onAllow={checkPermissions} />
        )}

        {appState === 'lobby' && (
            <LobbyScreen 
                key="lobby"
                stream={activeStream}
                devices={devices}
                selectedMic={selectedMic} setSelectedMic={setSelectedMic}
                selectedCam={selectedCam} setSelectedCam={setSelectedCam}
                onJoin={enterStudio}
            />
        )}

        {appState === 'studio' && (
            <StudioScreen 
                key="studio"
                stream={activeStream}
                recState={recState}
                recordedUrl={mediaUrl}
                isMicMuted={isMicMuted} toggleMic={toggleMic}
                isCamOff={isCamOff} toggleCam={toggleCam}
                startRecording={startRecording} stopRecording={stopRecording}
                pauseRecording={pauseRecording} resumeRecording={resumeRecording}
                onDiscardRecording={discardRecording}
                onDownload={handleDownload}
                onUpload={handleUpload} isUploading={isUploading} uploadProgress={uploadProgress}
                onLeave={() => window.location.reload()}
                onSettings={() => setAppState('lobby')}
            />
        )}
      </AnimatePresence>
    </div>
  );
}