'use client';
import { motion, LayoutGroup } from "motion/react";
import { useState, useEffect, useRef } from "react";

interface TabsProps {
  className?: string;
}

const tabs = [
  { id: "features", label: "Features" },
  { id: "enterprise", label: "Enterprise" },
  { id: "pricing", label: "Pricing" },
  { id: "resources", label: "Resources" },
];

export const Tabs = ({ className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveTab(""); // reset when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <LayoutGroup>
      <div
        ref={containerRef}
        className={`flex space-x-1 z-10 ${className}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              console.log("clicked:", tab.id);
              setActiveTab(tab.id);
            }}
            className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer ${className}`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="bubble"
                className="absolute inset-0 z-0 bg-primary"
                style={{ borderRadius: 9999 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
};