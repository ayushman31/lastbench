import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';

export const DashboardControlBar: React.FC = () => (
  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
    <div className="flex items-center gap-6 w-full md:w-auto">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer border-b-1 border-primary pb-1">
        <Filter size={16} />
        <span>Sort by creation date</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors pb-1">
        <span>All recordings</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors pb-1">
        <span>Status</span>
      </div>
    </div>

    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
      <button className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-[0_0_15px_oklch(0.4365_0.1044_156.7556_/_0.4)]">
        <Plus size={16} />
        <span>Create New</span>
      </button>
    </div>
  </div>
);
