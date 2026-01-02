"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";
import { AnimatedIconProps } from "./iconTypes";

const RecordIcon = ({
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
        ".podcast-ring",
        { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] },
        { duration: 0.6, ease: "easeInOut" }
      );

      animate(
        ".podcast-center",
        { scale: [1, 1.3, 1] },
        { duration: 0.4, ease: "easeOut" }
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
      <motion.circle
        className="podcast-ring"
        cx="12"
        cy="12"
        r="9"
        style={{ transformOrigin: "center" }}
      />
      <motion.circle
        className="podcast-ring"
        cx="12"
        cy="12"
        r="5"
        style={{ transformOrigin: "center" }}
      />

      <motion.circle
        className="podcast-center"
        cx="12"
        cy="12"
        r="1"
        style={{ transformOrigin: "center" }}
      />
    </motion.svg>
  );
};

export default RecordIcon;