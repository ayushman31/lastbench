'use client';

import { motion } from 'motion/react';
import { Mic, MonitorSpeaker, Video, VideoOff, MicOff, Copy, Check } from 'lucide-react';
import { StreamVideo } from '@/components/StreamVideo';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { DeviceSelect } from '../DeviceSelect'; 
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface LobbyScreenProps {
  stream: MediaStream | null;
  devices: { audio: MediaDeviceInfo[], video: MediaDeviceInfo[] };
  selectedMic: string;
  setSelectedMic: (mic: string) => void;
  selectedCam: string;
  setSelectedCam: (cam: string) => void;
  onJoin: () => void;
  isGuest?: boolean;
  guestName?: string;
  onGuestNameSubmit?: (name: string) => void;
  inviteLink?: string;
  showInviteLinkModal?: boolean;
  onCloseInviteLinkModal?: () => void;
}

export const LobbyScreen = ({
  stream,
  devices,
  selectedMic,
  setSelectedMic,
  selectedCam,
  setSelectedCam,
  onJoin,
  isGuest = false,
  guestName: propGuestName = '',
  onGuestNameSubmit,
  inviteLink,
  showInviteLinkModal = false,
  onCloseInviteLinkModal,
}: LobbyScreenProps) => {
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>(propGuestName);
  const [showGuestModal, setShowGuestModal] = useState<boolean>(isGuest && !propGuestName);
  const [copied, setCopied] = useState<boolean>(false);

  const handleMicToggle = () => {
    setIsMicMuted(!isMicMuted);
    stream?.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = isMicMuted);
  };

  const handleCamToggle = () => {
    setIsCamOff(!isCamOff);
  };

  const handleGuestNameSubmit = () => {
    if (guestName.trim().length < 2) {
      alert('Name must be at least 2 characters');
      return;
    }
    setShowGuestModal(false);
    onGuestNameSubmit?.(guestName.trim());
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-8 items-center justify-center"
      >
        <div className="w-full md:w-1/2 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-2xl ring-1 ring-white/10">
            {!isCamOff ? (
              <StreamVideo
                stream={stream}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                  {guestName ? guestName.charAt(0).toUpperCase() : 'G'}
                </div>
              </div>
            )}

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

        {/* Controls */}
        <div className="w-full md:w-[400px] flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isGuest ? 'Join Studio' : 'Create Studio'}
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
            <button 
              onClick={handleMicToggle} 
              className={`flex-1 h-12 rounded-lg border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors ${isMicMuted ? 'text-red-500' : 'text-foreground'}`}
            >
              {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button 
              onClick={handleCamToggle} 
              className={`flex-1 h-12 rounded-lg border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors ${isCamOff ? 'text-red-500' : 'text-foreground'}`}
            >
              {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          </div>

          <Button
            onClick={onJoin()}
            className="w-full h-12 text-lg shadow-primary/25"
          >
            {isGuest ? 'Join Studio' : 'Create Studio'}
          </Button>
        </div>
      </motion.div>

      {/* guest name modal */}
      {isGuest && !guestName && (
        <Modal
          isOpen={showGuestModal}
          onClose={() => {}}
          title="Enter Your Name"
          showCloseButton={false}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please enter your name to join the recording session
            </p>
            <Input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuestNameSubmit()}
              placeholder="Your name"
              autoFocus
            />
            <Button
              onClick={handleGuestNameSubmit}
              disabled={guestName.trim().length < 2}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </Modal>
      )}

      {/* share invite link modal */}
      <Modal
        isOpen={showInviteLinkModal}
        onClose={onCloseInviteLinkModal || (() => {})}
        title="Session Created"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with guests to invite them to your recording session
            </p>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Invite Link
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-background rounded-md px-3 py-2 border border-border overflow-hidden">
                  <p className="text-sm font-mono truncate">
                    {inviteLink}
                  </p>
                </div>
                <Button
                  onClick={copyInviteLink}
                  variant="secondary"
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 Tip: You can join the studio now and guests can join using this link while you're recording
            </p>
          </div>

          <Button
            onClick={onCloseInviteLinkModal}
            className="w-full"
          >
            Enter Studio
          </Button>
        </div>
      </Modal>
    </>
  );
};