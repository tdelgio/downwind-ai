"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";

import { LiveCamCard } from "@/components/live-cams/LiveCamCard";
import type { LiveCam } from "@/data/liveCams";

export function LiveCamsSection() {
  const [alertWestCams, setAlertWestCams] = useState<LiveCam[]>([]);
  const [alertWestLoaded, setAlertWestLoaded] = useState(false);
  const selectedCams = useMemo(() => selectTwoOceanCams(alertWestCams), [alertWestCams]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alertwest-cams")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { cameras?: LiveCam[] } | null) => {
        if (!cancelled && Array.isArray(payload?.cameras)) {
          setAlertWestCams(payload.cameras);
        }
      })
      .catch(() => {
        if (!cancelled) setAlertWestCams([]);
      })
      .finally(() => {
        if (!cancelled) setAlertWestLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="ocean-card rounded-[1.5rem] border p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Camera className="size-5 text-[#0d5968] dark:text-[#9debf9]" />
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-[#102b3a] dark:text-[#eefbff]">
            Live Cams
          </h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#5f7078] dark:text-[#b7cbd3]">
            Two quick live ocean views when verified public snapshots are available.
          </p>
        </div>
      </div>

      {selectedCams.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {selectedCams.map((cam) => (
            <LiveCamCard key={cam.id} cam={cam} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[#094c60]/12 bg-white/70 p-4 text-sm font-semibold text-[#536b73] dark:border-white/12 dark:bg-[#102a3a] dark:text-[#c9d9df]">
          {alertWestLoaded
            ? "No verified ocean camera snapshots available right now."
            : "Loading approved public camera inventory..."}
        </div>
      )}
    </section>
  );
}

function selectTwoOceanCams(cams: LiveCam[]) {
  const verified = cams
    .filter((cam) => cam.verified && cam.thumbnailWorking && cam.oceanVisible)
    .sort((a, b) => (b.oceanVisibilityScore ?? 0) - (a.oceanVisibilityScore ?? 0));

  const north =
    verified.find((cam) => cam.region === "north-shore") ??
    verified.find((cam) => cam.tags.includes("north-shore")) ??
    verified[0];
  const south =
    verified.find((cam) => cam.region === "south-side" && cam.id !== north?.id) ??
    verified.find((cam) => cam.tags.includes("south-side") && cam.id !== north?.id) ??
    verified.find((cam) => cam.id !== north?.id);

  return [north, south].filter((cam): cam is LiveCam => Boolean(cam)).slice(0, 2);
}
