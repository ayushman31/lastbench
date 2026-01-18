'use client';

import { Loader2, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { formatDuration } from '@repo/recording-engine';

export const StudioHeader = ({
  recState,
  recordedUrl,
  isUploading,
  uploadProgress,
  onSettings,
}: any) => {
  return (
    <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md z-10 relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
          V
        </div>
        <span className="font-medium">Vineeth's Studio</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted uppercase tracking-wider text-muted-foreground">
          Host
        </span>
      </div>

      {/* status */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        {recState.status === 'recording' ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-red-500">
              {formatDuration(recState.duration)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {recordedUrl ? 'Previewing Recording' : 'Ready to record'}
          </span>
        )}
      </div>

      {/* right */}
      {isUploading ? (
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="animate-spin text-primary" size={16} />
          <span className="text-muted-foreground">
            Uploading {uploadProgress}%
          </span>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings size={18} />
        </Button>
      )}
    </header>
  );
};
