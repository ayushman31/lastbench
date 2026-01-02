"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";
import { AnimatedIconProps } from "./iconTypes";

const HomeIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  hovered,
}: AnimatedIconProps) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (hovered) {
      animate(
        ".roof",
        { y: [-2, 0], opacity: [0.6, 1] },
        { duration: 0.4, ease: "easeOut" }
      );

      animate(
        ".house",
        { scale: [0.95, 1] },
        { duration: 0.3, ease: "easeOut" }
      );

      animate(
        ".door",
        { scaleY: [0, 1] },
        { duration: 0.3, ease: "easeOut" }
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
      <motion.path className="roof" d="M5 12l-2 0l9 -9l9 9l-2 0" />
      <motion.path
        className="house"
        style={{ transformOrigin: "center" }}
        d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"
      />
      <motion.path
        className="door"
        style={{ transformOrigin: "center bottom" }}
        d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"
      />
    </motion.svg>
  );
};

export default HomeIcon;