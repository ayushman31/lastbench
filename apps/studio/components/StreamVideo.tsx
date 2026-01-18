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
      className={`${className} ${
        isMirrored ? 'transform scale-x-[-1]' : ''
      }`}
    />
  );
};
