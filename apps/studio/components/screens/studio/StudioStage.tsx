'use client';

import { useRef } from 'react';
import { StreamVideo } from '@/components/StreamVideo';
import { Button } from '../../ui/button';
import { Download, UploadCloud } from 'lucide-react';

export const StudioStage = ({
  stream,
  recordedUrl,
  isCamOff,
  isMicMuted,
  onDownload,
  onUpload,
}: {
  stream: MediaStream | null;
  recordedUrl: string;
  isCamOff: boolean;
  isMicMuted: boolean;
  onDownload: () => void;
  onUpload: () => void;
}) => {
  const playbackRef = useRef<HTMLVideoElement>(null);

  return (
    <main className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
      {recordedUrl ? (
        /* playback mode */
        <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-border relative group">
          <video
            ref={playbackRef}
            src={recordedUrl}
            controls
            className="w-full h-full"
          />

          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={onDownload}
              variant="secondary"
              className="h-9 px-3 text-xs"
            >
              <Download size={14} className="mr-2" />
              Download
            </Button>
            <Button
              onClick={onUpload}
              variant="primary"
              className="h-9 px-3 text-xs"
            >
              <UploadCloud size={14} className="mr-2" />
              Upload
            </Button>
          </div>
        </div>
      ) : (
        /* live mode */
        <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/5">
          <StreamVideo
            stream={stream}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isCamOff ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {isCamOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                V
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5 text-white font-medium shadow-lg">
              Vineeth (Host)
            </div>

            {isMicMuted && (
              <div className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center text-white">
                muted
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
