"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function LiveDataRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
