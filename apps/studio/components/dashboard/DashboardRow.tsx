import React, { useRef } from 'react';
import { motion, Variants } from 'motion/react';
import { ClapIcon, ClapIconHandle } from '../icons/clapper';
import { StatusBadge } from './StatusBadge';
import { Recording } from '../types/recording.types';
import { rowVariants } from './animations';

interface DashboardRowProps {
  item: Recording;
}

export const DashboardRow: React.FC<DashboardRowProps> = ({ item }) => {
  const clapRef = useRef<ClapIconHandle>(null);

  return (
    <motion.div
      onMouseEnter={() => clapRef.current?.startAnimation()}
      onMouseLeave={() => clapRef.current?.stopAnimation()}
      variants={rowVariants as Variants}
      className="group grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all duration-200 cursor-pointer"
    >

      <div className="col-span-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
          <ClapIcon size={18} ref={clapRef} />
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-sidebar-ring transition-colors">
          {item.name}
        </span>
      </div>


      <div className="col-span-4 pr-4">
        <p className="text-sm text-muted-foreground truncate">
          {item.description}
        </p>
      </div>


      <div className="col-span-1">
        <StatusBadge status={item.status} />
      </div>

      <div className="col-span-2 text-center">
        <span className="text-sm text-muted-foreground">
          {item.createdAt}
        </span>
      </div>


      <div className="col-span-2 text-right">
        <span className="text-sm text-muted-foreground">
          {item.lastEdited}
        </span>
      </div>
    </motion.div>
  );
};
