"use client";

import { useState, useEffect } from "react";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Unauthenticated or network error, fallback gracefully
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading };
}
