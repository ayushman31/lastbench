'use client';
import { motion, LayoutGroup } from "motion/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { JSX } from "react";

interface TabsProps {
  className?: string;
}

const tabs = [
  { id: "features", label: "Features", path: "/features" },
  { id: "enterprise", label: "Enterprise", path: "/enterprise" },
  { id: "pricing", label: "Pricing", path: "/pricing" },
  { id: "contact", label: "Contact", path: "/contact" },
];

export const Tabs = ({ className }: TabsProps) : JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const currentTab = tabs.find(t => pathname.includes(t.path));
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else {
      setActiveTab("");
    }
  }, [pathname]);

  return (
    <LayoutGroup>
      <div className={`flex space-x-1 z-10 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              router.push(tab.path);
            }}
            className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer ${className}`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="bubble"
                className="absolute inset-0 z-0 bg-primary/20 border border-primary/50"
                style={{ borderRadius: 9999 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 ${activeTab === tab.id ? "text-primary" : "text-white/80 hover:text-white"}`}>
                {tab.label}
            </span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
};