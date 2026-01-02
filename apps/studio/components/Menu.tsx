"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from './MenuItem';
import GearIcon from './icons/settings';
import CreditCard from './icons/credit';
import ShieldCheck from './icons/security';
import UserCheckIcon from './icons/user';
import LogoutIcon from './icons/logout';
import { authClient, useSession } from '@repo/auth/client';

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { session, loading, user } = useSession();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if(!user) return null;

  const userName = user.name || user.email;

  return (
    <div className="flex justify-center p-4 text-neutral-200">
      <div className="w-full flex justify-end items-start gap-4">
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-neutral-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
          >
            <img 
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute right-0 top-14 w-80 bg-card border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-2">
                  
                  {/* 1. Header: Current User */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{userName}</span>
                      <span className="text-xs text-neutral-400">{user.email}</span>
                    </div>
                  </div>

                  {/* <div className="h-px bg-neutral-800 my-2 mx-1" /> */}

                  {/* FUTURE ENHANCEMENT: Workspace Switcher */}
                  {/* <div className="px-2 py-1"> */}
                    {/* <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider ml-1">Switch Workspaces</span>
                    
                    <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer group border border-transparent hover:border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-pink-600 flex items-center justify-center text-xs font-bold text-white">
                          A
                        </div>
                        <span className="text-sm text-neutral-200">Users Workspace</span>
                      </div>
                      <span className="text-[10px] font-medium text-neutral-400 bg-neutral-700/50 px-1.5 py-0.5 rounded">Free</span>
                    </div> */}

                    {/* <div className="mt-1 flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded border border-neutral-600 border-dashed flex items-center justify-center text-neutral-400 group-hover:border-neutral-400 group-hover:text-neutral-200 transition-colors">
                          <Plus size={14} />
                        </div>
                        <span className="text-sm text-neutral-400 group-hover:text-neutral-200">Create new</span>
                      </div>
                      
                      <button className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded text-[10px] font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/20">
                        <span className="text-[10px]">✨</span> Upgrade
                      </button>
                    </div> */}

                  {/* </div> */}

                  <div className="h-px w-full bg-border my-2" />

                  <div className="space-y-0.5">
                    <MenuItem icon={<UserCheckIcon hovered={false} size={18} />} label="Personal info" />
                    <MenuItem icon={<ShieldCheck hovered={false} size={18} />} label="Account Security" />
                    <MenuItem icon={<CreditCard hovered={false} size={18} />} label="Manage Subscription" />
                    <MenuItem icon={<GearIcon hovered={false} size={18} />} label="Settings" />
                  </div>

                  <div className="h-px bg-neutral-800 my-2 mx-1" />

                  <MenuItem icon={<LogoutIcon hovered={false} size={18} />} label="Logout" isDanger={false} onClick={() => {authClient.signOut(); window.location.href = "http://localhost:3000"}} />
                  
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Reusable Menu Item Component for cleaner code

export { Menu };