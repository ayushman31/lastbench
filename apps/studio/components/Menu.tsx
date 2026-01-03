"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { MenuItem } from './MenuItem';
import GearIcon from './icons/settings';
import CreditCard from './icons/credit';
import ShieldCheck from './icons/security';
import UserCheckIcon from './icons/user';
import LogoutIcon from './icons/logout';
import { authClient, useSession } from '@repo/auth/client';

// animation variants for staggered menu items
const menuItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { session, loading, user } = useSession();

  // close menu when clicking outside
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
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className="flex justify-center p-4 text-neutral-200"
    >
      <div className="w-full flex justify-end items-start gap-4">
        
        <div className="relative" ref={menuRef}>
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-neutral-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
          >
            <img 
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.34, 1.56, 0.64, 1],
                  opacity: { duration: 0.2 }
                }}
                className="absolute right-0 top-14 w-80 bg-card border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
                style={{ transformOrigin: 'top right' }}
              >
                {/* spotlight effect */}
                <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      background: 'radial-gradient(circle at top left, rgba(29, 222, 55, 0.2) 0%, rgba(17, 205, 95, 0.1) 40%, transparent 70%)',
                      filter: 'blur(25px)',
                    }}
                  />
                </div>

                <div className="p-2 relative">
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group"
                  >
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
                  </motion.div>

                  <div className="h-px w-full bg-border my-2" />

                  <motion.div 
                    className="space-y-0.5"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.15
                        }
                      }
                    }}
                  >
                    <MenuItem 
                      icon={<UserCheckIcon hovered={false} size={18} />} 
                      label="Personal info" 
                      variants={menuItemVariants as Variants}
                    />
                    <MenuItem 
                      icon={<ShieldCheck hovered={false} size={18} />} 
                      label="Account Security" 
                      variants={menuItemVariants as Variants}
                    />
                    <MenuItem 
                      icon={<CreditCard hovered={false} size={18} />} 
                      label="Manage Subscription" 
                      variants={menuItemVariants as Variants}
                    />
                    <MenuItem 
                      icon={<GearIcon hovered={false} size={18} />} 
                      label="Settings" 
                      variants={menuItemVariants as Variants}
                    />
                  

                  <div className="h-px bg-neutral-800 my-2 mx-1" />

                 
                    <MenuItem 
                      icon={<LogoutIcon hovered={false} size={18} />} 
                      label="Logout" 
                      isDanger={false} 
                      variants={menuItemVariants as Variants}
                      onClick={() => {authClient.signOut(); window.location.href = "http://localhost:3000"}} 
                    />
                  </motion.div>
                  
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export { Menu };
