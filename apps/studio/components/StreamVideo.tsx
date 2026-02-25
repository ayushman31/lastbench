'use client';

import { useEffect, useRef } from 'react';

export const StreamVideo = ({
  stream,
  isMirrored = true,
  className,
}: {
  stream: MediaStream | null;
  isMirrored?: boolean;
  className?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    console.log('[StreamVideo] Setting srcObject:', {
      streamId: stream.id,
      trackCount: stream.getTracks().length,
      tracks: stream.getTracks().map(t => ({ 
        kind: t.kind, 
        id: t.id, 
        enabled: t.enabled, 
        readyState: t.readyState,
        muted: t.muted,
        label: t.label
      }))
    });
    
    // Only set srcObject if it's different
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      
      // Check if video tracks are actually producing frames
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('[StreamVideo] Video track state:', {
          id: videoTrack.id,
          enabled: videoTrack.enabled,
          muted: videoTrack.muted,
          readyState: videoTrack.readyState,
          label: videoTrack.label
        });
      }
      
      // Wait for video to be ready before playing
      video.onloadedmetadata = () => {
        console.log('[StreamVideo] Metadata loaded, attempting play for stream:', stream.id);
        video.play().then(() => {
          console.log('[StreamVideo] Video playing successfully:', {
            streamId: stream.id,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
            readyState: video.readyState,
            currentTime: video.currentTime
          });
          
          // Check again after a delay to see if frames are rendering
          setTimeout(() => {
            console.log('[StreamVideo] Post-play check:', {
              streamId: stream.id,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              currentTime: video.currentTime,
              paused: video.paused
            });
          }, 1000);
        }).catch(err => {
          console.error('[StreamVideo] Error playing video:', err);
        });
      };
    }
  }, [stream]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`${className} ${
          isMirrored ? 'transform scale-x-[-1]' : ''
        }`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};
