import React from 'react';

export const DashboardHeader: React.FC = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold text-foreground mb-1">Recordings</h1>
    <p className="text-[var(--muted-foreground)] text-sm">
      Studio quality recordings for your podcasts. Need help getting started? <span className="text-primary-foreground cursor-pointer relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:bg-primary after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100">Watch the tutorial</span>
    </p>
  </div>
);
