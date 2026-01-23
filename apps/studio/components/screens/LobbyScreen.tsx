'use client';

import { motion } from 'motion/react';
import { Mic, MonitorSpeaker, Video, VideoOff, MicOff } from 'lucide-react';
import { StreamVideo } from '@/components/StreamVideo';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { DeviceSelect } from '../DeviceSelect'; 
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const LobbyScreen = ({
  stream,
  devices,
  selectedMic,
  setSelectedMic,
  selectedCam,
  setSelectedCam,
  onJoin,
}: any) => {
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);
  const handleMicToggle = () => {
    setIsMicMuted(!isMicMuted);
    stream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = !isMicMuted);
  };
  const handleCamToggle = () => {
    setIsCamOff(!isCamOff);
  };
  return (  
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-8 items-center justify-center"
    >
      {/* Preview Section - Unchanged */}
      <div className="w-full md:w-1/2 space-y-4">
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-2xl ring-1 ring-white/10">
          {!isCamOff ? <StreamVideo
            stream={stream}
            className="w-full h-full object-cover"
          /> : <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
              V
            </div>
          </div>}

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-white">
              Preview
            </span>
          </div>

          <div className="absolute right-4 bottom-4 h-16 w-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <AudioVisualizer stream={stream} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="w-full md:w-[400px] flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Join Studio
          </h1>
          <p className="text-muted-foreground">
            Adjust your settings before entering.
          </p>
        </div>

        <div className="space-y-5 bg-card/50 p-6 rounded-xl border border-border shadow-sm">
          <DeviceSelect
            icon={Mic}
            label="Microphone"
            value={selectedMic}
            options={devices.audio}
            onChange={setSelectedMic}
          />
          <DeviceSelect
            icon={Video}
            label="Camera"
            value={selectedCam}
            options={devices.video}
            onChange={setSelectedCam}
          />
          <DeviceSelect 
            icon={MonitorSpeaker} 
            label="Output Device" 
            value={'default'} 
            options={[{deviceId: 'default', label: 'Default Output'}]} 
            onChange={() => {}} 
          />
        </div>

        <div className="flex gap-3">
           <button onClick={handleMicToggle} className={`flex-1 h-12 rounded-lg border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors ${!isMicMuted ? 'text-red-500' : 'text-foreground'}`}>
              {!isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
           </button>
           <button onClick={handleCamToggle} className={`flex-1 h-12 rounded-lg border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors ${isCamOff ? 'text-red-500' : 'text-foreground'}`}>
              {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
           </button>
        </div>

        <Button
          onClick={onJoin}
          className="w-full h-12 text-lg shadow-primary/25"
        >
          Join Studio
        </Button>
      </div>
    </motion.div>
  );
};