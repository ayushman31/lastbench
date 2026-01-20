"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";

// Matches the exact "from below" stagger animation of your reference
const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0, scale: 0.95 },
    show: {
      opacity: 1,
      height: "auto",
      scale: 1,
      transition: {
        height: { duration: 0.2, ease: "easeOut" },
        // This creates the "one by one" effect
        staggerChildren: 0.07, 
        delayChildren: 0.05, 
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      scale: 0.95,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.1 },
      },
    },
  },
  item: {
    // This y: 20 makes it appear from below
    hidden: { opacity: 0, y: 20 }, 
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  },
} as const;

interface DeviceSelectProps {
  icon: any;
  label: string;
  value: string;
  options: { deviceId: string; label: string }[];
  onChange: (value: string) => void;
}

export const DeviceSelect = ({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: DeviceSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.deviceId === value)?.label || "Select device...";

  return (
    <div 
      className={`space-y-1.5 w-full relative transition-all ${isOpen ? "z-50" : "z-0"}`} 
      ref={containerRef}
    >
      <label className="text-xs font-medium text-muted-foreground ml-1">
        {label}
      </label>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between bg-card border rounded-lg py-2.5 pl-3 pr-3 text-sm 
            transition-all duration-200 outline-none
            ${isOpen ? "border-primary ring-1 ring-primary/20" : "border-input hover:border-primary/50"}
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="text-primary shrink-0">
              <Icon size={16} />
            </div>
            <span className="truncate text-foreground font-medium">
              {selectedLabel}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground shrink-0 ml-2"
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden origin-top"
              variants={ANIMATION_VARIANTS.container}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <motion.div
                variants={ANIMATION_VARIANTS.container}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ overflow: "hidden" }} // prevent scrollbar during expansion
              >

                <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {options.length === 0 ? (
                    <motion.div variants={ANIMATION_VARIANTS.item} className="px-4 py-3 text-sm text-muted-foreground text-center">
                      No devices found
                    </motion.div>
                  ) : (
                    options.map((option) => {
                      const isSelected = option.deviceId === value;
                      return (
                        <motion.div
                          key={option.deviceId}
                          variants={ANIMATION_VARIANTS.item}
                          onClick={() => {
                            onChange(option.deviceId);
                            setIsOpen(false);
                          }}
                          className={`
                            relative px-3 py-2.5 mx-1 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-colors
                            text-foreground hover:bg-muted/50
                          `}
                        >
                          {/* Check Icon - Only this indicates selection now */}
                          <div
                            className={`flex items-center justify-center w-4 h-4 shrink-0 transition-all duration-200 ${
                              isSelected ? "opacity-100 text-primary scale-100" : "opacity-0 scale-75"
                            }`}
                          >
                            <Check size={14} />
                          </div>

                          <span className="truncate">{option.label}</span>

                          {/* Optional: Very subtle background hint for selected item, can remove if you want strictly only checkmark */}
                          {isSelected && (
                            <motion.div
                              layoutId={`active-bg-${label}`}
                              className="absolute inset-0 bg-primary/5 rounded-lg -z-10"
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};