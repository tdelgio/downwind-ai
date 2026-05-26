"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { LiveCam } from "@/data/liveCams";
import { cn } from "@/lib/utils";

export function LiveCamCard({
  cam,
  featured = false,
}: {
  cam: LiveCam;
  featured?: boolean;
}) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const snapshotCandidate = cam.snapshotUrl ?? cam.previewImageUrl;
  const hasSnapshot = Boolean(snapshotCandidate) && cam.verified;
  const canEmbed = Boolean(cam.embedUrl) && cam.embedType !== "external";
  const canRenderImage = hasSnapshot || cam.embedType === "mjpeg";
  const imageUrl = useMemo(() => {
    const source = cam.embedType === "mjpeg" ? cam.streamUrl : snapshotCandidate;
    if (!source || !cam.verified) return null;
    if (source.startsWith("/")) return `${source}${source.includes("?") ? "&" : "?"}t=${refreshTick}`;
    return `${source}${source.includes("?") ? "&" : "?"}t=${refreshTick}`;
  }, [cam.embedType, cam.streamUrl, cam.verified, refreshTick, snapshotCandidate]);

  useEffect(() => {
    if (!canRenderImage || !cam.verified) return;
    const interval = window.setInterval(() => {
      setImageLoaded(false);
      setImageFailed(false);
      setRefreshTick((tick) => tick + 1);
    }, Math.max(15, cam.refreshSeconds) * 1000);

    return () => window.clearInterval(interval);
  }, [cam.refreshSeconds, cam.verified, canRenderImage]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "group rounded-2xl border border-[#094c60]/12 bg-white/78 p-4 shadow-[0_12px_28px_rgba(7,35,45,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(7,35,45,0.1)] dark:border-white/12 dark:bg-[#091d2b]",
        featured && "border-[#0d5968]/24 bg-[#edf8f7] dark:border-[#9debf9]/22 dark:bg-[#0b2230]",
      )}
    >
      {canEmbed || imageUrl ? (
        <div
          className={cn(
            "relative mb-4 block overflow-hidden rounded-xl border border-[#094c60]/10 bg-[#dfeff0] dark:border-white/12 dark:bg-[#102a3a]",
            featured ? "h-40 sm:h-44" : "h-36 sm:h-40",
          )}
        >
          {canEmbed ? <CamEmbed cam={cam} /> : null}
          {!canEmbed && imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imageUrl}
              src={imageUrl}
              alt={`${cam.name} live camera snapshot`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          {!canEmbed && imageUrl && !imageLoaded && !imageFailed ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#d9ecef] via-[#f6fbfb] to-[#d9ecef] dark:from-[#102a3a] dark:via-[#193b4c] dark:to-[#102a3a]" />
          ) : null}
          {!canEmbed && imageFailed ? (
            <div className="absolute inset-0 flex flex-col justify-center bg-[#e9f3f3] px-4 text-[#536b73] dark:bg-[#102a3a] dark:text-[#c9d9df]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">Snapshot unavailable</p>
              <p className="mt-1 max-w-sm text-xs font-semibold leading-4">
                Open ALERTWest to view this camera.
              </p>
            </div>
          ) : null}
          {(canEmbed || imageUrl) && !imageFailed ? <div className="absolute inset-0 bg-gradient-to-t from-[#071723]/55 via-transparent to-transparent" /> : null}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold leading-tight text-[#102b3a] dark:text-[#eefbff]">
            {cam.name}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#61747c] dark:text-[#b7cbd3]">
            {formatRegion(cam.region)}
          </p>
        </div>
        <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-4 w-full rounded-xl border-[#094c60]/14 bg-white/75 text-[#102b3a] hover:bg-[#f4faf8] dark:border-white/12 dark:bg-[#102a3a] dark:text-[#eefbff] dark:hover:bg-[#163747]"
      >
        <a href={cam.sourcePage} target="_blank" rel="noreferrer">
          Open Camera <ExternalLink className="size-3.5" />
        </a>
      </Button>
    </motion.article>
  );
}

function CamEmbed({ cam }: { cam: LiveCam }) {
  if (!cam.embedUrl) return null;

  if (cam.embedType === "iframe") {
    return (
      <iframe
        src={cam.embedUrl}
        title={`${cam.name} live camera`}
        loading="lazy"
        className="absolute inset-0 size-full border-0"
        allow="fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (cam.embedType === "snapshot") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cam.embedUrl}
        alt={`${cam.name} camera snapshot`}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  if (cam.embedType === "hls") {
    return (
      <video
        src={cam.embedUrl}
        controls
        preload="metadata"
        playsInline
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  return null;
}

function formatRegion(region: LiveCam["region"]) {
  return region.replaceAll("-", " ");
}
