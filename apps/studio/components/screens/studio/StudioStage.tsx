'use client';

import { useRef, useState, useEffect } from 'react';
import { StreamVideo } from '@/components/StreamVideo';
import { Button } from '../../ui/button';
import { Download, UploadCloud, MicOff, Maximize2, Minimize2, X } from 'lucide-react';
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
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [fullscreenParticipantId, setFullscreenParticipantId] = useState<string | null>(null);
  const [isInFullscreen, setIsInFullscreen] = useState(false);

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

  const fullscreenParticipant = fullscreenParticipantId 
    ? participants.find(p => p.clientId === fullscreenParticipantId)
    : null;

  const toggleFullscreen = async (participantId: string) => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
        setFullscreenParticipantId(participantId);
        setIsInFullscreen(true);
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[StudioStage] Fullscreen error:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[StudioStage] Exit fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setIsInFullscreen(isFullscreen);
      
      if (!isFullscreen) {
        setFullscreenParticipantId(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {/* fullscreen container*/}
      <div
        ref={fullscreenContainerRef}
        className={`${isInFullscreen ? 'block' : 'hidden'}`}
      >
        {fullscreenParticipant && (
          <div className="w-screen h-screen bg-black flex flex-col">
            {/* main fullscreen participant */}
            <div className="flex-1 relative">
              <ParticipantTile
                participant={fullscreenParticipant}
                isFullscreen={true}
                onToggleFullscreen={exitFullscreen}
              />
            </div>

            {/* thumbnail strip of other participants */}
            {participants.length > 1 && (
              <div className="absolute bottom-0 left-1  bg-gradient-to-t from-black/90 to-transparent p-6">
                <div className="flex gap-3 overflow-x-auto justify-center">
                  {participants
                    .filter(p => p.clientId !== fullscreenParticipantId)
                    .map((participant) => (
                      <div
                        key={participant.clientId}
                        className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity hover:scale-105 transform"
                        onClick={() => setFullscreenParticipantId(participant.clientId)}
                      >
                        <ParticipantTile
                          participant={participant}
                          isThumbnail={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* normal studio view */}
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
          /* live mode - multi-participant grid */
          <div className="w-full h-full max-w-7xl mx-auto">
            <div
              className={`grid ${getGridLayout(participants.length)} ${getGridRows(participants.length)} gap-4 h-full`}
            >
              {participants.map((participant) => (
                <ParticipantTile
                  key={participant.clientId}
                  participant={participant}
                  onToggleFullscreen={() => toggleFullscreen(participant.clientId)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

function ParticipantTile({ 
  participant,
  isFullscreen = false,
  isThumbnail = false,
  onToggleFullscreen,
}: { 
  participant: Participant;
  isFullscreen?: boolean;
  isThumbnail?: boolean;
  onToggleFullscreen?: () => void;
}) {
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
    // TODO: here we can play around with the aspect ratio and the fullscreen mode to make different available modes for the user to choose
    <div className={`relative ${isThumbnail ? 'aspect-video' : isFullscreen ? 'w-screen h-screen' : 'aspect-video'} bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 flex items-center justify-center group`}>
      {participant.stream && !isCamOff ? (
        <StreamVideo
          stream={participant.stream}
          isMirrored={false}
          className="w-full h-full object-cover"
        />
      ) : (
        /* camera off - show avatar */
        <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className={`${isThumbnail ? 'w-16 h-16 text-xl' : isFullscreen ? 'w-32 h-32 text-5xl' : 'w-24 h-24 text-3xl'} rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground border-2 border-border`}>
            {participant.userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* participant info overlay */}
      <div className={`absolute ${isThumbnail ? 'bottom-2 left-2 right-2' : 'bottom-4 left-4 right-4'} flex items-center justify-between`}>
        <div className={`bg-black/60 backdrop-blur-md ${isThumbnail ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg border border-white/10 flex items-center gap-2 shadow-lg`}>
          <span className={`${isThumbnail ? 'text-xs' : 'text-sm'} font-medium text-white truncate ${isThumbnail ? 'max-w-[120px]' : 'max-w-[200px]'}`}>
            {participant.userName}
          </span>
          {participant.isHost && (
            <span className={`px-1.5 py-0.5 rounded ${isThumbnail ? 'text-[8px]' : 'text-[9px]'} font-bold bg-primary/30 text-primary uppercase tracking-wider`}>
              Host
            </span>
          )}
        </div>

        {isMicMuted && (
          <div className={`${isThumbnail ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center text-white shadow-lg`}>
            <MicOff size={isThumbnail ? 12 : 14} />
          </div>
        )}
      </div>

      {/* connection quality indicator */}
      {!isThumbnail && (
        <div className={`absolute ${isFullscreen ? 'top-6 right-6' : 'top-4 right-4'}`}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg" />
        </div>
      )}

      {/* fullscreen toggle button  */}
      {!isThumbnail && onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className={`absolute ${isFullscreen ? 'top-6 left-6' : 'top-4 left-4'} bg-black/60 backdrop-blur-md hover:bg-black/80 transition-all p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 shadow-lg`}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 size={18} className="text-white" />
          ) : (
            <Maximize2 size={18} className="text-white" />
          )}
        </button>
      )}
    </div>
  );
}