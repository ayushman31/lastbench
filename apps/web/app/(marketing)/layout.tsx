"use client";

import Header from "@/components/Header";
import LightRays from "@/components/LightRays";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { JSX, ReactNode } from "react";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-[#121212] relative text-white overflow-hidden">
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#006239"
          raysSpeed={0.6}
          lightSpread={0.1}
          rayLength={3}
          followMouse={false}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-grow flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
