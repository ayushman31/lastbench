"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Send,
  BarChart2,
  Video,
  PlaneTakeoff,
  AudioLines,
  LayoutGrid,
  Clapperboard,
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
}

interface SearchResult {
  actions: Action[];
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.4 },
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  },
} as const;

const allActionsSample: Action[] = [
  {
    id: "1",
    label: "Recording 1",
    icon: <Clapperboard className="h-4 w-4 " />,
    description: "Recording 1",
    short: "⌘K",
    end: "Agent",
  },
  {
    id: "2",
    label: "Recording 2",
    icon: <Clapperboard className="h-4 w-4" />,
    description: "Recording 2",
    short: "⌘P",
    end: "Command",
  },
  {
    id: "3",
    label: "Recording 3",
    icon: <Clapperboard className="h-4 w-4" />,
    description: "Recording 3",
    end: "Application",
  },
  {
    id: "4",
    label: "Recording 4",
    icon: <Clapperboard className="h-4 w-4" />,
    description: "Recording 4",
    end: "Active",
  },
  {
    id: "5",
    label: "Recording 5",
    icon: <Clapperboard className="h-4 w-4" />,
    description: "Recording 5",
    end: "Link",
  },
];

function ActionSearchBar({
  actions = allActionsSample,
  defaultOpen = false,
}: {
  actions?: Action[];
  defaultOpen?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(defaultOpen);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 200);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery) return actions;
    const q = debouncedQuery.toLowerCase().trim();
    return actions.filter(a =>
      `${a.label} ${a.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [debouncedQuery, actions]);

  useEffect(() => {
    if (!isFocused) {
      setResult(null);
      setActiveIndex(-1);
      return;
    }
    setResult({ actions: filteredActions });
    setActiveIndex(-1);
  }, [filteredActions, isFocused]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative flex flex-col items-center min-h-[300px]">
        {/* inpout */}
        <div className="w-full max-w-sm sticky top-0 bg-background z-10 pt-4 pb-1">
          <div className="relative">
            <Input
              placeholder="What's up?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              className="h-9 rounded-lg bg-background text-foreground border-border pr-9"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="popLayout">
                {query ? (
                  <motion.div key="send" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div key="search" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* options */}
        <AnimatePresence>
          {isFocused && result && !selectedAction && (
            <motion.div
              className="w-full max-w-sm mt-1 rounded-md border border-border bg-popover shadow-sm overflow-hidden"
              variants={ANIMATION_VARIANTS.container}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <motion.ul>
                {result.actions.map((action, i) => {
                  const active = i === activeIndex;
                  return (
                    <motion.li
                      key={action.id}
                      variants={ANIMATION_VARIANTS.item}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer
                        ${active ? "bg-accent" : "hover:bg-accent"}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground group-hover:text-primary">
                          {action.icon}
                        </span>
                        <span className="text-sm text-foreground">
                          {action.label}
                        </span>
                        {action.description && (
                          <span className="text-xs text-muted-foreground">
                            {action.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {action.short}
                        {action.end}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>

              <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex justify-between">
                <span>⌘K to open</span>
                <span>ESC to cancel</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ActionSearchBar;
