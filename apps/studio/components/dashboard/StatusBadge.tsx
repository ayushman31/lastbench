import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    Ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Draft: "bg-neutral-700/30 text-neutral-400 border-neutral-700/50",
    Paused: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${styles[status as keyof typeof styles] || styles.Draft}`}>
      {status}
    </span>
  );
};
