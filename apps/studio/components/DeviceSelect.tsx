'use client';

import { ChevronDown } from 'lucide-react';

export const DeviceSelect = ({
  icon: Icon,
  value,
  options,
  onChange,
  label,
}: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-medium text-muted-foreground ml-1">
      {label}
    </label>

    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Icon size={16} />
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-card border border-input rounded-lg py-2.5 pl-10 pr-8 text-sm focus:ring-2 focus:ring-primary outline-none"
      >
        {options.map((opt: any) => (
          <option key={opt.deviceId} value={opt.deviceId}>
            {opt.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        size={14}
      />
    </div>
  </div>
);
