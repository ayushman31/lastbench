"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";
import { AnimatedIconProps } from "./iconTypes";

const UserPlusIcon = ({
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
        ".user-avatar",
        { scale: 1.05, y: -1 },
        { duration: 0.25, ease: "easeOut" }
      );

      animate(
        ".plus-sign",
        { scale: 1.15, rotate: 90 },
        { duration: 0.3, ease: "easeOut" }
      );
    } else {
      animate(
        ".user-avatar",
        { scale: 1, y: 0 },
        { duration: 0.2, ease: "easeInOut" }
      );

      animate(
        ".plus-sign",
        { scale: 1, rotate: 0 },
        { duration: 0.25, ease: "easeInOut" }
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />

      <motion.g className="user-avatar" style={{ transformOrigin: "50% 50%" }}>
        <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
        <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
      </motion.g>

      <motion.g className="plus-sign" style={{ transformOrigin: "19px 19px" }}>
        <path d="M16 19h6" />
        <path d="M19 16v6" />
      </motion.g>
    </motion.svg>
  );
};

export default UserPlusIcon;