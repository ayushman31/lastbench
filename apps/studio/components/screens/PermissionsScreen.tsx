'use client';

import { motion } from 'motion/react';
import { Video } from 'lucide-react';
import { Button } from '../ui/button';
import VideoIcon from '../icons/video';

export const PermissionsScreen = ({
  onAllow,
}: {
  onAllow: () => void;
}) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <VideoIcon size={32} className="text-primary" hovered={false} />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        Let's check your setup
      </h2>
      <p className="text-muted-foreground mb-8">
        We need access to your camera and microphone.
      </p>

      <Button onClick={onAllow} className="w-full py-3 text-lg">
        Allow Access
      </Button>
    </motion.div>
  </div>
);
