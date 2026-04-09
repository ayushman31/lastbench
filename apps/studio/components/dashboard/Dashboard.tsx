"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardControlBar } from './DashboardControlBar';
import { DashboardRow } from './DashboardRow';
import { Recording } from '../types/recording.types';
import { AnimatePresence } from 'motion/react';
import { useSession } from '@repo/auth/client';

// TODO : still there are things to be fixed here

const Dashboard: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const { user } = useSession();
  
  useEffect(() => {
    
    const fetchRecordings = async () => {
      if (!user?.id) {
        return;
      }
      
      try {
        const url = `http://localhost:4001/api/db/recording/user/${user?.id}`;
        const res = await fetch(url); 
        
        if (!res.ok) {
          console.error('[Dashboard] Response not OK:', res.status);
          return;
        }
        
        const data = await res.json();

        const mapped: Recording[] = data.map((rec: any) => ({
          id: rec.id || rec.recordingId,
          name: rec.title,
          description: rec.description || "No description added yet",
          status: rec.status,
          createdAt: new Date(rec.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        }));

        setRecordings(mapped);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRecordings();
  }, [user?.id]);

  return (
    <div className="min-h-screen p-8 md:p-12 font-sans bg-background text-foreground">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <DashboardHeader />
          <DashboardControlBar />
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <div className="col-span-3">Recording Name</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-center">Created At</div>
          </div>

          <div className="space-y-1 mt-2">
            {recordings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No recordings found. Create your first recording!
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {recordings.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.5)
                    }}
                  >
                    <DashboardRow item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
