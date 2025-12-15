// apps/web/hooks/use-session.ts
"use client";

import { authClient } from "@repo/auth/client";
import { Session } from "@repo/auth/server";
import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then((data) => {
      setSession(data.data);
      setLoading(false);
    });
  }, []);

  return { session, loading };
}
