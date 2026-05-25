import { Camera } from "lucide-react";

export type LiveCameraCardProps = {
  title: string;
  location: string;
  status: "live" | "offline";
  timestamp: string;
  imageUrl?: string;
  streamUrl?: string;
  visualRead: string;
  tone?: "harbor" | "north" | "south";
};

export function LiveCameraCard({
  title,
  location,
  status,
  timestamp,
  imageUrl,
  streamUrl,
  visualRead,
  tone = "harbor",
}: LiveCameraCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#094c60]/10 bg-white/70 shadow-[0_12px_28px_rgba(7,35,45,0.05)] dark:border-white/12 dark:bg-[#0b2230]">
      <div className={`live-camera-frame live-camera-${tone}`}>
        {streamUrl ? (
          <video className="absolute inset-0 size-full object-cover" src={streamUrl} muted playsInline preload="metadata" />
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 size-full object-cover" src={imageUrl} alt={`${title} live camera`} />
        ) : (
          <>
            <div className="camera-scan" />
            <div className="camera-waterline" />
          </>
        )}
        <div className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-white/55 bg-white/75 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#0d5968] backdrop-blur-md dark:border-white/20 dark:bg-[#071723]/78 dark:text-[#d9f8ff]">
          <span className={`live-pulse size-2 rounded-full ${status === "live" ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span className="truncate">{status}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="weather-data text-base leading-none text-white drop-shadow">{location}</p>
            <p className="mt-1 text-xs font-medium text-white/80 drop-shadow">{title}</p>
          </div>
          <Camera className="size-5 text-white/85 drop-shadow" />
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold leading-6 text-[#102b3a]">{visualRead}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6b7d84] dark:text-[#b7cbd3]">
          <span className="min-w-0 truncate">{timestamp}</span>
          <span className="shrink-0">Visual</span>
        </div>
      </div>
    </article>
  );
}
