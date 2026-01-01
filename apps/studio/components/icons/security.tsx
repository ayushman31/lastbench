import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";

type AnimatedIconProps = {
  hovered: boolean;
  size: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

type ShieldCheckProps = AnimatedIconProps & { hovered?: boolean };

const ShieldCheck = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  hovered = false,
}: ShieldCheckProps) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (hovered) {
      animate(
        ".shield-body",
        { scale: [1, 1.05, 1] },
        { duration: 0.35, ease: "easeOut" }
      );

      animate(
        ".shield-check",
        { pathLength: [0, 1], opacity: [0, 1] },
        { duration: 0.3, ease: "easeInOut" }
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
          className="shield-body"
          style={{ transformOrigin: "50% 50%" }}
          d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06"
        />
        <motion.path className="shield-check" d="M15 19l2 2l4 -4" />
      </svg>
    </motion.div>
  );
};

export default ShieldCheck;