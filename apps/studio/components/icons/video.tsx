"use client";
import { motion, useAnimate } from "motion/react";
import { AnimatedIconProps } from "./iconTypes";

const VideoIcon = ({
  size,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
}: AnimatedIconProps) => {
  const [scope, animate] = useAnimate();

  const handleHoverStart = () => {
    // Animate the video body (rectangle)
    animate(".video-body", { scale: [1, 1.05, 1] }, { duration: 0.6, ease: "easeInOut" });
    // Animate the play triangle
    animate(".video-play", { scale: [1, 1.2, 1] }, { duration: 0.4, ease: "easeOut" });
    // Animate the whole icon with a tilt
    animate(".video-icon", { rotate: [0, -5, 5, 0] }, { duration: 0.8, ease: "easeInOut" });
  };

  const handleHoverEnd = () => {
    // Reset to default state if needed
    animate(".video-body", { scale: 1 }, { duration: 0.3 });
    animate(".video-play", { scale: 1 }, { duration: 0.3 });
    animate(".video-icon", { rotate: 0 }, { duration: 0.3 });
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
        className="video-icon"
      >
        {/* Video rectangle */}
        <motion.rect
          className="video-body"
          x="2"
          y="6"
          width="14"
          height="12"
          rx="2"
          ry="2"
          style={{ transformOrigin: "9px 12px" }}
        />
        {/* Play triangle */}
        <motion.polygon
          className="video-play"
          points="22 7 16 12 22 17 22 7"
          style={{ transformOrigin: "19px 12px" }}
        />
      </svg>
    </motion.div>
  );
};

export default VideoIcon;