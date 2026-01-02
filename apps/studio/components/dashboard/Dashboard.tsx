"use client";
import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Mail, 
  Send, 
  Sparkles, 
  MousePointerClick, 
  MessageCircle, 
  PlayCircle
} from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardControlBar } from './DashboardControlBar';
import { DashboardRow } from './DashboardRow';
import { Recording } from '../types/recording.types';
import { containerVariants } from './animations';

const RECORDINGS_DATA: Recording[] = [
  {
    id: 1,
    name: "Recording 1",
    description: "This is the description of recording 1",
    status: "Draft",
    createdAt: "23rd Dec 2025",
    lastEdited: "just now",
    icon: <Zap size={18} className="text-yellow-400" />
  },
  {
    id: 2,
    name: "Recording 2",
    description: "This is the description of recording 2",
    status: "Ready",
    createdAt: "24th Dec 2025",
    lastEdited: "just now",
    icon: <Mail size={18} className="text-blue-400" />
  },
  {
    id: 3,
    name: "Recording 3",
    description: "This is the description of recording 3",
    status: "Ready",
    createdAt: "25th Dec 2025",
    lastEdited: "just now",
    icon: <Send size={18} className="text-orange-400" />
  },
  {
    id: 4,
    name: "Recording 4",
    description: "This is the description of recording 4",
    status: "Draft",
    createdAt: "26th Dec 2025",
    lastEdited: "25 minutes ago",
    icon: <Sparkles size={18} className="text-purple-400" />
  },
  {
    id: 5,
    name: "Recording 5",
    description: "This is the description of recording 5",
    status: "Draft",
    createdAt: "27th Dec 2025",
    lastEdited: "50 minutes ago",
    icon: <MousePointerClick size={18} className="text-pink-400" />
  },
  {
    id: 6,
    name: "Recording 6",
    description: "This is the description of recording 6",
    status: "Paused",
    createdAt: "28th Dec 2025",
    lastEdited: "25 minutes ago",
    icon: <MessageCircle size={18} className="text-teal-400" />
  },
  {
    id: 7,
    name: "Recording 7",
    description: "This is the description of recording 7",
    status: "Ready",
    createdAt: "29th Dec 2025",
    lastEdited: "1 day ago",
    icon: <PlayCircle size={18} className="text-green-400" />
  }
];

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen p-8 md:p-12 font-sans bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        
        {/* header animation */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
        >
          <DashboardHeader />
          <DashboardControlBar />
        </motion.div>

        {/* table content */}
        <motion.div 
          className="w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* table header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <div className="col-span-3">Recording Name</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-center">Created At</div>
            <div className="col-span-2 text-right">Last Edited</div>
          </div>

          {/* rows */}
          <div className="space-y-1 mt-2">
            {RECORDINGS_DATA.map((item) => (
              <DashboardRow key={item.id} item={item} />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
