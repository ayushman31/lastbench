"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";

type AnimatedIconProps = {
  hovered: boolean;
  size: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

type LogoutIconProps = AnimatedIconProps & { hovered?: boolean };

const LogoutIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  hovered = false,
}: LogoutIconProps) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (hovered) {
      animate(
        ".logout-arrow, .logout-arrow-bottom",
        { x: [0, 6, 0] },
        { duration: 0.3, ease: "easeInOut" }
      );

      animate(
        ".logout-door",
        { x: [0, -2, 0] },
        { duration: 0.25, ease: "easeOut" }
      );
    }
  }, [hovered, animate]);

  return (
    <motion.div ref={scope} className={`inline-flex ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          className="logout-door"
          style={{ transformOrigin: "50% 50%" }}
          d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"
        />
        <motion.path className="logout-arrow" d="M9 12h12" />
        <motion.path className="logout-arrow-bottom" d="M18 15l3 -3l-3 -3" />
      </svg>
    </motion.div>
  );
};

export default LogoutIcon;