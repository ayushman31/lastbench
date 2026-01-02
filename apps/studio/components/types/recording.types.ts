import { ReactNode } from 'react';

export interface Recording {
  id: number;
  name: string;
  description: string;
  status: "Draft" | "Ready" | "Paused";
  createdAt: string;
  lastEdited: string;
  icon: ReactNode;
}
