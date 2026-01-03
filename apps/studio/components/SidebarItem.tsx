"use client";

import Link from "next/link";
import React, { useState } from "react";
import { motion, Variants } from "motion/react";

type SidebarItemProps = {
  href: string;
  icon: React.ReactElement;
  label: string;
  className?: string;
  iconClassName?: string;
  variants?: Variants;
};

export default function SidebarItem({
  href,
  icon,
  label,
  className,
  iconClassName,
  variants,
}: SidebarItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.li 
      variants={variants}
      className={`w-full flex justify-center ${className}`}
    >
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex w-full justify-center rounded-lg px-2 py-3 transition-colors"
      >
        <div className="flex flex-col items-center gap-1">
          {React.cloneElement(icon as React.ReactElement<{ hovered: boolean, className: string }>, {
            hovered,
            className: `size-6 transition-colors duration-500 text-muted-foreground group-hover:text-primary ${iconClassName}`,
          })}

          <span className="text-[10px] text-muted-foreground transition-all duration-500 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0">
            {label}
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
