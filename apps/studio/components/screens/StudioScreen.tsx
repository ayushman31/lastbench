'use client';

import { motion } from 'motion/react';
import { StudioHeader } from './studio/StudioHeader';
import { StudioStage } from './studio/StudioStage';
import { StudioControls } from './studio/StudioControls';
import { type RecordingState } from '@repo/recording-engine';
import type { Participant } from '@/lib/types';

interface StudioScreenProps {
  stream: MediaStream | null;
  recState: RecordingState;
  recordedUrl: string;
  isMicMuted: boolean;
  toggleMic: () => void;
  isCamOff: boolean;
  toggleCam: () => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onDiscardRecording: () => void;
  isUploading: boolean;
  uploadProgress: number;
  onLeave: () => void;
  onSettings: () => void;
  isGuest?: boolean;
  participants?: Participant[];
  userName?: string;
}

export const StudioScreen = (props: StudioScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col h-screen relative bg-zinc-950"
    >
      <StudioHeader 
        {...props} 
        userName={props.userName}
        isGuest={props.isGuest}
        participantCount={props.participants?.length || 0}
      />
      <StudioStage 
        {...props} 
      />
      <StudioControls 
        {...props} 
        isGuest={props.isGuest}
      />
    </motion.div>
  );
};