'use client';

import { motion } from 'motion/react';
import { StudioHeader } from './studio/StudioHeader';
import { StudioStage } from './studio/StudioStage';
import { StudioControls } from './studio/StudioControls';

export const StudioScreen = (props: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col h-screen relative bg-zinc-950"
    >
      <StudioHeader {...props} />
      <StudioStage {...props} />
      <StudioControls {...props} />
    </motion.div>
  );
};
