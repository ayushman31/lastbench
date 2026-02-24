'use client';

import { useRef } from 'react';
import { StreamVideo } from '@/components/StreamVideo';
import { Button } from '../../ui/button';
import { Download, UploadCloud, MicOff } from 'lucide-react';
import type { Participant } from '@/lib/types';

export const StudioStage = ({
  stream,
  recordedUrl,
  isCamOff,
  isMicMuted,
  onDownload,
  onUpload,
  isGuest,
  participants = [],
  isAutoUploaded = false,
}: {
  stream: MediaStream | null;
  recordedUrl: string;
  isCamOff: boolean;
  isMicMuted: boolean;
  onDownload: () => void;
  onUpload: () => void;
  isGuest?: boolean;
  participants?: Participant[];
  isAutoUploaded?: boolean;
}) => {
  const playbackRef = useRef<HTMLVideoElement>(null);

  // Calculate grid layout based on participant count
  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-3';
  };

  const getGridRows = (count: number) => {
    if (count <= 2) return 'grid-rows-1';
    if (count <= 4) return 'grid-rows-2';
    return 'grid-rows-2';
  };

  return (
    <main className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
      {recordedUrl ? (
        /* Playback mode */
        <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-border relative group">
          <video
            ref={playbackRef}
            src={recordedUrl}
            controls
            className="w-full h-full"
          />

          {!isGuest && (
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={onDownload}
                variant="secondary"
                className="h-9 px-3 text-xs"
              >
                <Download size={14} className="mr-2" />
                Download
              </Button>
              {isAutoUploaded ? (
                <div className="h-9 px-3 text-xs flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg">
                  <UploadCloud size={14} />
                  <span>Uploaded</span>
                </div>
              ) : (
                <Button
                  onClick={onUpload}
                  variant="primary"
                  className="h-9 px-3 text-xs"
                >
                  <UploadCloud size={14} className="mr-2" />
                  Upload
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Live mode - Multi-participant grid */
        <div className="w-full h-full max-w-7xl mx-auto">
          <div
            className={`grid ${getGridLayout(participants.length)} ${getGridRows(participants.length)} gap-4 h-full`}
          >
            {participants.map((participant) => (
              <ParticipantTile
                key={participant.clientId}
                participant={participant}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

// Participant Tile Component
function ParticipantTile({ participant }: { participant: Participant }) {
  const hasVideoTrack = participant.stream && participant.stream.getVideoTracks().length > 0;
  const isCamOff = !hasVideoTrack || !participant.stream?.getVideoTracks()[0]?.enabled;
  
  const hasAudioTrack = participant.stream && participant.stream.getAudioTracks().length > 0;
  const isMicMuted = !hasAudioTrack || !participant.stream?.getAudioTracks()[0]?.enabled;

  console.log('[ParticipantTile]', {
    clientId: participant.clientId,
    userName: participant.userName,
    hasStream: !!participant.stream,
    hasVideoTrack,
    isCamOff,
  });

  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
      {participant.stream && !isCamOff ? (
        <StreamVideo
          stream={participant.stream}
          isMirrored={false}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Camera off - show avatar */
        <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground border-2 border-border">
            {participant.userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
          <span className="text-sm font-medium text-white truncate max-w-[200px]">
            {participant.userName}
          </span>
          {participant.isHost && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/30 text-primary uppercase tracking-wider">
              Host
            </span>
          )}
        </div>

        {isMicMuted && (
          <div className="w-8 h-8 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
            <MicOff size={14} />
          </div>
        )}
      </div>

      {/* Connection quality indicator */}
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg" />
      </div>
    </div>
  );
}