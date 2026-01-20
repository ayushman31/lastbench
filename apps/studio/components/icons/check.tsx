"use client";
import { motion, useAnimate } from "motion/react";
import { AnimatedIconProps } from "./iconTypes";

const CheckIcon = ({
  size = 28,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
}: AnimatedIconProps) => {
  const [scope, animate] = useAnimate();

  const handleHoverStart = () => {
    // Animate the check path drawing
    animate(
      ".check-path",
      { pathLength: [0, 1], opacity: [0, 1], scale: [0.5, 1] },
      { duration: 0.4, ease: "easeOut" }
    );
    // Animate the whole icon with a subtle bounce
    animate(
      ".check-icon",
      { scale: [1, 1.1, 1] },
      { duration: 0.5, ease: "easeInOut" }
    );
  };

  const handleHoverEnd = () => {
    // Reset to default state
    animate(".check-path", { pathLength: 1, opacity: 1, scale: 1 }, { duration: 0.3 });
    animate(".check-icon", { scale: 1 }, { duration: 0.3 });
  };

  return (
    <motion.div
      ref={scope}
      className={`inline-flex ${className}`}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
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
        className="check-icon"
      >
        <motion.path
          className="check-path"
          d="M4 12 9 17L20 6"
          style={{ pathLength: 1, transformOrigin: "12px 12px" }}
        />
      </svg>
    </motion.div>
  );
};

export default CheckIcon;