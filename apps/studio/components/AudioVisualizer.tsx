'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

export const AudioVisualizer = ({
  stream,
  className,
}: {
  stream: MediaStream | null;
  className?: string;
}) => {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLevel(avg);
        rafRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (e) {
      console.warn('Audio Context Error', e);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  return (
    <div className={`flex items-end ${className}`}>
      <motion.div
        className="w-full bg-primary rounded-t-sm"
        animate={{ height: `${Math.min(level / 2.55, 100)}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </div>
  );
};
