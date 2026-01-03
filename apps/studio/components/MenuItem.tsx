"use client";
import { useState } from "react";
import React from "react";
import { motion, Variants } from "motion/react";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isDanger?: boolean;
  onClick?: () => void;
  variants?: Variants;
}

const MenuItem = ({ icon, label, isDanger = false, onClick, variants }: MenuItemProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      variants={variants}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group cursor-pointer
        ${isDanger ? "text-red-400 hover:bg-red-500/10" : "text-neutral-400 hover:bg-neutral-800"}`}
    >
      <span className={`transition-colors ${isDanger ? "text-red-400 group-hover:text-red-500" : "text-neutral-500 group-hover:text-primary"}`}>
        {React.cloneElement(icon as React.ReactElement<{ hovered: boolean }>, { hovered })}
      </span>
      {label}
    </motion.button>
  );
};

export { MenuItem };
