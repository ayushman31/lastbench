"use client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { motion, Variants } from "motion/react";
import SidebarItem from "./SidebarItem";
import HomeIcon from "./icons/home";
import ProjectsIcon from "./icons/projects";
import UserPlusIcon from "./icons/invite";
import RecordIcon from "./icons/record";
import RocketIcon from "./icons/rocket";
import PartyPopperIcon from "./icons/party";
import GearIcon from "./icons/settings";

const inter = Inter({ subsets: ['latin'] });

export const Sidebar = () => {
  return (
    <motion.aside 
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className="flex h-screen w-20 flex-col items-center border-r bg-background py-4"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mb-6"
      >
        <Image src="/logo.svg" alt="logo" width={40} height={40} />
      </motion.div>

      <nav className="flex flex-1 flex-col gap-1">
        <motion.ul 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.4
              }
            }
          }}
          className="flex flex-col gap-1"
        >
          <SidebarItem href="/" label="Dashboard" icon={<HomeIcon hovered={false} size={24} />} variants={itemVariants as Variants} />
          <SidebarItem href="/projects" label="Projects" icon={<ProjectsIcon hovered={false} size={24} />} variants={itemVariants as Variants} />
          <SidebarItem href="/invitations" label="Invite" icon={<UserPlusIcon hovered={false} size={24} />} variants={itemVariants as Variants} />
          <SidebarItem href="/recording-rules" label="Record" icon={<RecordIcon hovered={false} size={24} />} variants={itemVariants as Variants} />
        </motion.ul>

        <div className="flex-1" />

        <motion.ul 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.5
              }
            }
          }}
          className="flex flex-col gap-1"
        >
          <SidebarItem href="/upgrade" label="Upgrade" icon={<RocketIcon hovered={false} size={24} />} variants={itemVariants} />
          <SidebarItem href="/whats-new" label="What's New" icon={<PartyPopperIcon hovered={false} size={24} />} variants={itemVariants} />
          <SidebarItem href="/settings" label="Settings" icon={<GearIcon hovered={false} size={24} />} variants={itemVariants} />
        </motion.ul>
      </nav>
    </motion.aside>
  );
};

// animation variants for sidebar items
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};
