'use client';

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Play,
  Square,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../ui/button';

export const StudioControls = ({
  recState,
  recordedUrl,
  isMicMuted,
  isCamOff,
  toggleMic,
  toggleCam,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  onDiscardRecording,
  onLeave,
  isGuest = false,
}: any) => {
  return (
    <footer className="h-24 flex items-center justify-center px-6 pb-4">
      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-2xl">
        {/* Mic/Cam controls */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-xl transition-all ${
              isMicMuted
                ? 'bg-red-500/20 text-red-500'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isMicMuted ? 'Unmute' : 'Mute'}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleCam}
            className={`p-3 rounded-xl transition-all ${
              isCamOff
                ? 'bg-red-500/20 text-red-500'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isCamOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>

        {/* Recording controls - Only show for host */}
        {!isGuest && (
          <>
            {recordedUrl ? (
              <Button variant="secondary" onClick={onDiscardRecording}>
                <RefreshCw size={16} className="mr-2" />
                New Recording
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {recState.status === 'recording' ||
                recState.status === 'paused' ? (
                  <>
                    <button
                      onClick={stopRecording}
                      className="h-12 px-6 bg-red-500/20 text-red-500 rounded-xl font-medium border border-red-500/50 flex items-center gap-2 hover:bg-red-500/30 transition-colors"
                    >
                      <Square size={16} fill="currentColor" />
                      Stop
                    </button>

                    <button
                      onClick={
                        recState.status === 'paused'
                          ? resumeRecording
                          : pauseRecording
                      }
                      className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-accent transition-colors"
                    >
                      {recState.status === 'paused' ? (
                        <Play size={20} />
                      ) : (
                        <span className="font-bold text-xs">||</span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startRecording}
                    className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg flex items-center gap-2 transition-colors"
                  >
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Record
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Leave button */}
        <div className={`${!isGuest ? 'border-l border-white/10 pl-4 ml-2' : ''}`}>
          <button
            onClick={onLeave}
            className="p-3 rounded-xl hover:bg-red-500/20 text-red-500 transition-all"
            title="Leave Studio"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};