"use client";

import { useEffect, useState } from "react";
import { authClient } from "./client.js";
// import type { Session } from "../server/auth.js";
import type { Session } from "../types.js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data, error: sessionError } = await authClient.getSession() as { data: Session | null; error: Error | null };
        
        if (!mounted) return;

        if (sessionError) {
          setError(new Error(sessionError.message));
          setSession(null);
        } else {
          setSession(data as Session);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch session'));
        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    return () => {
      mounted = false;
    };
  }, []);

  const refetch = async () => {
    setLoading(true);
    const { data, error: sessionError } = await authClient.getSession() as { data: Session | null; error: Error | null };
    
    if (sessionError) {
      setError(new Error(sessionError.message));
      setSession(null);
    } else {
      setSession(data as Session);
      setError(null);
    }
    setLoading(false);
  };

  return { 
    session, 
    loading, 
    error,
    refetch, // useful for refreshing session after updates
    user: session?.user ?? null,
  };
}