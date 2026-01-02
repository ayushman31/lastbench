"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";
import { AnimatedIconProps } from "./iconTypes";

const ProjectsIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  hovered = false,  
}: AnimatedIconProps) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (hovered) {
      animate(
        ".folder-body",
        { scale: [1, 1.05, 1] },
        { duration: 0.3, ease: "easeOut" }
      );

      animate(
        ".kanban-line",
        { x: [-4, 0], opacity: [0, 1] },
        { duration: 0.4, ease: "easeInOut", delay: 0.1 }
      );
    }
  }, [hovered, animate]);

  return (
    <motion.svg
      ref={scope}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-flex ${className}`}
    >
      <motion.path
        className="folder-body"
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
        style={{ transformOrigin: "50% 50%" }}
      />

      <motion.line
        className="kanban-line"
        x1="9"
        y1="13"
        x2="9"
        y2="17"
        opacity="0"
      />
      <motion.line
        className="kanban-line"
        x1="15"
        y1="13"
        x2="15"
        y2="17"
        opacity="0"
      />
    </motion.svg>
  );
};

export default ProjectsIcon;