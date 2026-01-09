"use client";

import { motion, AnimatePresence } from "motion/react";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

const QUOTES = [
  {
    text: "Podcasting is the most intimate medium in the world. You’re literally inside someone’s head.",
    author: "Joe Rogan",
    role: "Host, The Joe Rogan Experience",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=JoeRogan"
  },
  {
    text: "Podcasting allows creators to build a direct relationship with their audience in a way no other medium can.",
    author: "Sarah Koenig",
    role: "Creator & Host, Serial",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=SarahKoenig"
  },
  {
    text: "Podcasting is about trust. People invite you into their lives, often during very personal moments.",
    author: "Ira Glass",
    role: "Host & Producer, This American Life",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=IraGlass"
  },
  {
    text: "The power of podcasts is that they reward depth, not clicks.",
    author: "Nicholas Quah",
    role: "Podcast Analyst, Hot Pod",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=NicholasQuah"
  },
  {
    text: "Podcasting is still young, which means creators are defining the rules in real time.",
    author: "Alex Blumberg",
    role: "Co-founder, Gimlet Media",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=AlexBlumberg"
  },
  {
    text: "Audio creates a connection that feels human in a way screens often don’t.",
    author: "James Cridland",
    role: "Podcast Industry Analyst",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=JamesCridland"
  }
];


export function AuthLayout({ children, mode }: { children: React.ReactNode, mode: "signin" | "signup" }) {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-primary-foreground">
      
      <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12 xl:p-20 relative">
        
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="w-10 h-10 text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 transition-transform">
            <Image src="/logo.svg" alt="logo" width={48} height={48} />
          </Link>
          
          <div className="text-sm">
            <span className="text-muted-foreground">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Link 
              href={mode === "signin" ? "/signup" : "/login"}
              className="text-primary-foreground font-semibold cursor-pointer relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:bg-primary after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {mode === "signin" ? "Register" : "Login"}
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {children}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground mt-12">
          <span>© 2025 LastBench</span>
          <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
            <Globe size={12} />
            <span>ENG</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-background relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.4]" />

        <div className="relative max-w-lg w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-start"
            >
              <motion.img 
                src={QUOTES[currentQuote]?.avatar}
                alt={QUOTES[currentQuote]?.author}
                className="w-16 h-16 rounded-2xl mb-8 bg-muted shadow-sm border border-border p-1"
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              <h2 className="text-3xl font-bold leading-tight text-primary-foreground mb-8">"{QUOTES[currentQuote]?.text}"</h2>
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-muted-foreground"></div>
                <div>
                  <p className="font-semibold text-primary-foreground">{QUOTES[currentQuote]?.author}</p>
                  <p className="text-sm text-primary">{QUOTES[currentQuote]?.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function SocialButton({ onClick, disabled }: { onClick: () => void, disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-xl text-primary-foreground bg-background hover:bg-muted transition-all duration-200 font-medium text-sm disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}


export function InputField({ type, placeholder, value, onChange, icon: Icon, required }: any) {
  const [show, setShow] = useState(false);
  const isPwd = type === "password";
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={isPwd && show ? "text" : type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-background border border-border text-primary-foreground text-sm rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-border transition-all placeholder:text-muted-foreground"
      />
      {isPwd && (
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}