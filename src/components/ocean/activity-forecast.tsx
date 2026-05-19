import Link from "next/link";
import type { ElementType } from "react";
import { Anchor, ArrowUp, CloudRain, Fish, Navigation, ShieldAlert, Waves } from "lucide-react";

import type { ForecastWindow, OceanConditionSnapshot, RouteScore } from "@/lib/ocean";

type Activity = "downwind" | "fishing";
type Zone = "windward" | "leeward";

export function ActivityForecastPage({
  activity,
  selectedZone,
  snapshot,
  score,
}: {
  activity: Activity;
  selectedZone: Zone;
  snapshot: OceanConditionSnapshot;
  score: RouteScore;
}) {
  const zones: Zone[] = ["windward", "leeward"];
  const zoneLabel = getZoneLabel(selectedZone);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex gap-2">
        {zones.map((zone) => (
          <ZoneChip key={zone} zone={zone} active={zone === selectedZone} href={`/${activity}?zone=${zone}`} />
        ))}
      </div>
      <section className="ocean-card rounded-[1.5rem] border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f626a]">{zoneLabel}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#102b3a]">
              {zoneLabel} {activity === "downwind" ? "Downwind Read" : "Fishing Read"}
            </h2>
          </div>
          <StatusPill status={getLiveStatus(snapshot)} live />
        </div>
        {activity === "downwind" ? (
          <DownwindMode zone={selectedZone} zoneWind={getZoneWind(snapshot, selectedZone)} snapshot={snapshot} score={score} />
        ) : (
          <FishingMode zone={selectedZone} zoneWind={getZoneWind(snapshot, selectedZone)} snapshot={snapshot} score={score} />
        )}
      </section>
    </div>
  );
}

export function HomeForecastOverview({ snapshot, score }: { snapshot: OceanConditionSnapshot; score: RouteScore }) {
  const wind = getWindDisplay(snapshot, { direction: "ENE", speed: "18-22 kt", gust: "28 kt", degrees: 68 });
  const oceanRead = buildOceanRead("downwind", "windward", snapshot, score, wind);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="hero-ocean ocean-card overflow-hidden rounded-[1.5rem] border p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f626a]">Live now</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-normal text-[#102b3a] sm:text-5xl">
              What the ocean is doing right now.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#4f626a]">
              Wind, bumps, tide, rain, and the simple Maui read for going on the water.
            </p>
          </div>
          <LiveWindCard wind={wind} snapshot={snapshot} />
        </div>
      </section>

      <div>
        <OceanReadCard read={oceanRead} score={score.runQualityScore} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SeaStateCard snapshot={snapshot} />
        <RainRiskCard snapshot={snapshot} />
      </div>

      <TideCard snapshot={snapshot} />

      <div className="flex flex-wrap gap-3">
        <Link href="/forecast" className="rounded-full border border-[#102b3a] bg-[#102b3a] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,43,58,0.12)]">
          See extended forecast
        </Link>
        <Link href="/downwind" className="rounded-full border border-[#d7e0e3] bg-white/70 px-5 py-3 text-sm font-semibold text-[#102b3a] transition hover:border-[#102b3a] hover:bg-white">
          Downwind read
        </Link>
        <Link href="/fishing" className="rounded-full border border-[#d7e0e3] bg-white/70 px-5 py-3 text-sm font-semibold text-[#102b3a] transition hover:border-[#102b3a] hover:bg-white">
          Fishing read
        </Link>
      </div>
    </div>
  );
}

export function ExtendedForecastOverview({
  selectedZone,
  snapshot,
  score,
}: {
  selectedZone: Zone;
  snapshot: OceanConditionSnapshot;
  score: RouteScore;
}) {
  const zones: Zone[] = ["windward", "leeward"];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex gap-2">
        {zones.map((zone) => (
          <ZoneChip key={zone} zone={zone} active={zone === selectedZone} href={`/forecast?zone=${zone}`} />
        ))}
      </div>
      <section className="ocean-card rounded-[1.5rem] border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-[#102b3a]">{getZoneLabel(selectedZone)} extended forecast</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7078]">Three-day outlook for wind, bumps, tide, rain, and the activity condition.</p>
          </div>
          <StatusPill status={`Score ${score.runQualityScore}`} />
        </div>
        <div className="mt-5">
          <ThreeDayForecastSection snapshot={snapshot} zone={selectedZone} />
        </div>
      </section>
    </div>
  );
}

function DownwindMode({ zone, zoneWind, snapshot, score }: { zone: Zone; zoneWind: WindDisplay; snapshot: OceanConditionSnapshot; score: RouteScore }) {
  const swell = parseSwell(formatSwell(snapshot));
  const launchWindow = score.bestLaunchWindow ? `${formatTime(score.bestLaunchWindow.startTime)} launch` : "Window pending";
  const downwindRead = buildDownwindRead(zone, snapshot, score, zoneWind);

  return (
    <div className="mt-6 space-y-5">
      <div>
        <SectionKicker title="How will the run feel?" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <LiveWindBlock label="Run wind" wind={zoneWind} />
          <PerformanceCard
            icon={Waves}
            label="Bumps / sea state"
            tone="swell"
            primary={swell.height}
            secondary={`${swell.period} period · ${swell.direction} direction`}
            note="Open-ocean bump texture, not shorebreak size."
          />
          <PerformanceCard
            icon={Navigation}
            label="Swell alignment"
            tone="swell"
            primary={getSwellAlignment(zoneWind, swell.direction)}
            secondary={`${swell.direction} swell against ${zoneWind.direction} wind`}
            note={getCrossingSwellNote(zoneWind, swell.direction)}
          />
          <PerformanceCard
            icon={Anchor}
            label="Launch window"
            tone="wind"
            primary={launchWindow}
            secondary={score.bestLaunchWindow?.shortForecast ?? "Uses forecast wind and rain windows."}
            note="Best raw model window, not a guarantee."
          />
          <PerformanceCard
            icon={CloudRain}
            label="Rain bands"
            tone="rain"
            primary={formatRain(snapshot)}
            secondary={getRainImpact(snapshot)}
            note="Rain bands can shut down or spike trades quickly."
          />
          <PerformanceCard
            icon={Anchor}
            label="Finish / harbor check"
            tone="tide"
            primary={snapshot.tide.trend}
            secondary={`Kahului tide ${snapshot.tide.currentWaterLevelFt ?? "-"} ft`}
            note="Inside water can be cleaner than offshore bumps."
          />
        </div>
      </div>

      <div>
        <SectionKicker title="Run interpretation" />
        <div className="mt-4">
          <OceanReadCard read={downwindRead} score={score.runQualityScore} />
        </div>
      </div>

      <div>
        <SectionKicker title="Today's downwind periods" />
        <div className="mt-4 space-y-3">
          {buildForecastWindows(snapshot).map((window) => (
            <ForecastWindowCard key={`${window.label}-${window.wind}`} window={window} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FishingMode({ zone, zoneWind, snapshot, score }: { zone: Zone; zoneWind: WindDisplay; snapshot: OceanConditionSnapshot; score: RouteScore }) {
  const swell = parseSwell(formatSwell(snapshot));
  const fishingRead = buildFishingRead(zone, snapshot, zoneWind);

  return (
    <div className="mt-6 space-y-5">
      <div>
        <SectionKicker title="Is it comfortable and safe to fish?" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <FishingComfortCard swell={swell} zone={zone} />
          <PerformanceCard
            icon={Navigation}
            label="Wind chop"
            tone="wind"
            primary={`${zoneWind.direction} ${zoneWind.speed}`}
            secondary={`gust ${zoneWind.gust}`}
            note={zone === "windward" ? "Exposed water will feel choppier in trades." : "Protected sides may stay more manageable."}
          />
          <PerformanceCard
            icon={Fish}
            label="Tide movement"
            tone="tide"
            primary={snapshot.tide.trend}
            secondary={`current level ${snapshot.tide.currentWaterLevelFt ?? "-"} ft`}
            note="Movement helps drift, but check harbor timing."
          />
          <PerformanceCard
            icon={CloudRain}
            label="Rain / squalls"
            tone="rain"
            primary={formatRain(snapshot)}
            secondary={getRainImpact(snapshot)}
            note="Passing rain can cut visibility and change wind fast."
          />
          <PerformanceCard
            icon={ShieldAlert}
            label="Marine alerts"
            tone="alert"
            primary={snapshot.alerts.length ? `${snapshot.alerts.length} active` : "None active"}
            secondary={snapshot.alerts[0]?.event ?? "No active warning in current data."}
            note="Safety check before longer runs offshore."
          />
          <PerformanceCard
            icon={Anchor}
            label="Drift quality"
            tone="swell"
            primary={getDriftQuality(zoneWind, snapshot)}
            secondary={`water temp ${snapshot.swell.waterTempF ? `${snapshot.swell.waterTempF} F` : "not available"}`}
            note="Water clarity placeholder will connect when a source is ready."
          />
        </div>
      </div>

      <div>
        <SectionKicker title="Fishing interpretation" />
        <div className="mt-4">
          <OceanReadCard read={fishingRead} score={score.dataConfidenceScore} />
        </div>
      </div>

      <div>
        <SectionKicker title="Next fishing periods" />
        <div className="mt-4">
          <ThreeDayForecastSection snapshot={snapshot} zone={zone} />
        </div>
      </div>
    </div>
  );
}

function ThreeDayForecastSection({ snapshot, zone = "windward", compact = false }: { snapshot: OceanConditionSnapshot; zone?: Zone; compact?: boolean }) {
  const days = buildThreeDayForecast(snapshot.forecastWindows, zone);

  return (
    <section className={compact ? "ocean-card-soft rounded-[1.25rem] border p-4" : "ocean-card-soft rounded-[1.25rem] border p-5"}>
      <h2 className={compact ? "text-xl font-semibold tracking-normal text-[#102b3a]" : "text-2xl font-semibold tracking-normal text-[#102b3a]"}>Extended read</h2>
      <div className="mt-3 space-y-2">
        {days.map((day) => {
          const wind = parseWind(day.wind);
          const swell = parseSwell(day.swell);
          const call = classifyWindow(Number.parseInt(wind.speed, 10), Number.parseInt(wind.gust, 10), Number.parseInt(day.rain, 10));
          return (
            <article key={day.day} className="ocean-row rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-[#102b3a]">{day.day}</p>
                <div className={getReadClass(call)}>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] opacity-65">Condition</p>
                  <p className="mt-0.5 text-base font-semibold">{call}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-cyan-800/10 bg-cyan-50/55 px-3 py-3">
                  <WindArrow degrees={cardinalToDegrees(wind.direction)} />
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-cyan-900/65">Wind</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-950">{wind.direction} {wind.speed}</p>
                    <p className="mt-1 text-xs font-semibold text-amber-700">gust {wind.gust}</p>
                  </div>
                </div>
                <ForecastMetric icon={Waves} label="Bumps / sea" value={swell.height} detail={`${swell.period} · ${swell.direction}`} tone="swell" />
                <ForecastMetric icon={CloudRain} label="Rain" value={day.rain} detail="risk" tone="rain" />
              </div>
              {!compact ? <p className="mt-3 text-sm leading-6 text-[#6b7d84]">{day.read}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SectionKicker({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-normal text-[#102b3a]">{title}</h3>
    </div>
  );
}

function PerformanceCard({
  icon: Icon,
  label,
  tone,
  primary,
  secondary,
  note,
}: {
  icon: ElementType;
  label: string;
  tone: "wind" | "swell" | "tide" | "rain" | "alert";
  primary: string;
  secondary: string;
  note: string;
}) {
  const toneClasses = {
    wind: "border-cyan-800/10 bg-cyan-50/55 text-cyan-950",
    swell: "border-blue-800/10 bg-blue-50/55 text-blue-950",
    tide: "border-indigo-800/10 bg-indigo-50/55 text-indigo-950",
    rain: "border-teal-800/10 bg-teal-50/55 text-teal-950",
    alert: "border-orange-800/15 bg-orange-50/60 text-orange-950",
  };

  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-5 opacity-80" />
        <CategoryPill label={label} tone={tone} />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none tracking-[-0.01em]">{primary}</p>
      <p className="mt-2 text-sm font-semibold opacity-80">{secondary}</p>
      <p className="mt-4 text-sm leading-6 opacity-75">{note}</p>
    </article>
  );
}

function FishingComfortCard({ swell, zone }: { swell: ReturnType<typeof parseSwell>; zone: Zone }) {
  return (
    <article className="rounded-2xl border border-blue-800/10 bg-blue-50/40 p-5 text-blue-950">
      <div className="flex items-center gap-2">
        <Waves className="size-5 text-blue-700" />
        <CategoryPill label="Sea comfort" tone="swell" />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none">{getSeaComfort(swell.height, zone)}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Sea" value={swell.height} tone="swell" />
        <MiniStat label="Period" value={swell.period} tone="swell" />
        <MiniStat label="Dir" value={swell.direction} tone="swell" />
      </div>
      <p className="mt-4 text-sm leading-6 text-blue-900/75">
        Comfort is weighted toward sea state and exposure, not downwind performance.
      </p>
    </article>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "swell" | "wind" | "tide" | "rain" }) {
  const toneClasses = {
    swell: "border-blue-800/10 bg-white/70 text-blue-950",
    wind: "border-cyan-800/10 bg-white/70 text-cyan-950",
    tide: "border-indigo-800/10 bg-white/70 text-indigo-950",
    rain: "border-teal-800/10 bg-white/70 text-teal-950",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] opacity-60">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ForecastMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string;
  detail?: string;
  tone: "swell" | "tide" | "rain";
}) {
  const toneClasses = {
    swell: "border-blue-800/10 bg-blue-50/55 text-blue-950",
    tide: "border-indigo-800/10 bg-indigo-50/55 text-indigo-950",
    rain: "border-teal-800/10 bg-teal-50/55 text-teal-950",
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${toneClasses[tone]}`}>
      <Icon className="size-4 shrink-0 opacity-70" />
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] opacity-65">{label}</p>
        <p className="mt-1 text-lg font-semibold leading-none">{value}</p>
        {detail ? <p className="mt-1 text-sm font-medium opacity-75">{detail}</p> : null}
      </div>
    </div>
  );
}

function LiveWindCard({ wind, snapshot }: { wind: WindDisplay; snapshot: OceanConditionSnapshot }) {
  return (
    <div className="rounded-[1.35rem] border border-cyan-800/10 bg-cyan-50/60 p-5 shadow-[0_16px_38px_rgba(8,74,92,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <CategoryPill label="Wind" tone="wind" />
        <SourceFreshnessBadge source={snapshot.wind.source} />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <WindArrow degrees={wind.degrees} large />
        <div>
          <p className="text-5xl font-semibold leading-none tracking-[-0.01em] text-cyan-950">{wind.direction}</p>
          <p className="mt-2 text-2xl font-semibold text-[#102b3a]">{wind.speed}</p>
          <p className="mt-2 inline-flex rounded-full border border-amber-700/15 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
            gust {wind.gust}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-cyan-900/65">
        Wind arrow shows flow coming from {wind.direction}.
      </p>
    </div>
  );
}

function SeaStateCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const swell = parseSwell(formatSwell(snapshot));
  return (
    <section className="ocean-card rounded-[1.5rem] border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Waves className="size-5 text-blue-700" />
          <CategoryPill label="Sea / bumps" tone="swell" />
        </div>
        <SourceFreshnessBadge source={snapshot.swell.source} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-900/60">Size</p>
          <p className="mt-1 text-4xl font-semibold leading-none text-blue-950">{swell.height}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-900/60">Period</p>
          <p className="mt-1 text-3xl font-semibold leading-none text-blue-950">{swell.period}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-900/60">Direction</p>
          <p className="mt-1 text-3xl font-semibold leading-none text-blue-950">{swell.direction}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#526a73]">
        Sea size / bumps is the open-ocean surface energy. It is not the same as shorebreak size.
      </p>
    </section>
  );
}

function TideCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const next = snapshot.tide.trend === "rising" ? snapshot.tide.nextHigh : snapshot.tide.nextLow;
  return (
    <section className="ocean-card rounded-[1.5rem] border border-indigo-800/10 bg-indigo-50/45 p-5">
      <div className="flex items-start justify-between gap-3">
        <CategoryPill label="Tide" tone="tide" />
        <SourceFreshnessBadge source={snapshot.tide.source} />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-900/60">Trend</p>
          <p className="mt-1 text-4xl font-semibold capitalize leading-none text-indigo-950">{snapshot.tide.trend}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-900/60">Current</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-950">{snapshot.tide.currentWaterLevelFt ?? "-"} ft</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-indigo-900/75">
        Next {next?.type ?? "tide"} {next ? `${formatTime(next.time)} · ${next.heightFt} ft` : "not available"}. Falling/slack tide tends to be easier around harbor entries.
      </p>
    </section>
  );
}

function RainRiskCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const rain = formatRain(snapshot);
  const rainNumber = Number.parseInt(rain, 10);
  const impact = Number.isFinite(rainNumber) && rainNumber >= 35 ? "Showers may disturb wind quality." : "Lower rain impact on wind quality.";
  return (
    <section className="ocean-card rounded-[1.5rem] border border-teal-800/10 bg-teal-50/45 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudRain className="size-5 text-teal-700" />
          <CategoryPill label="Rain" tone="rain" />
        </div>
        <StatusPill status="Cloud / squall risk" />
      </div>
      <p className="mt-5 text-5xl font-semibold leading-none text-teal-950">{rain}</p>
      <p className="mt-3 text-sm leading-6 text-teal-900/75">{impact}</p>
    </section>
  );
}

function OceanReadCard({ read, score }: { read: string; score: number }) {
  return (
    <section className="ocean-card rounded-[1.5rem] border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f626a]">Ocean read</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#102b3a]">Conditions verdict</h2>
        </div>
        <div className="rounded-2xl border border-[#102b3a]/10 bg-[#102b3a] px-3 py-2 text-right text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/65">Score</p>
          <p className="text-2xl font-semibold leading-none">{score}</p>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-[#2d4752]">{read}</p>
    </section>
  );
}

type ForecastWindowView = {
  label: string;
  wind: string;
  gust: string;
  windDirection: string;
  windDegrees: number;
  swell: string;
  tide: string;
  rain: string;
  read: WindowCall;
};

type WindowCall = "Solid" | "Mixed" | "Heavy";

function ForecastWindowCard({ window }: { window: ForecastWindowView }) {
  const swell = parseSwell(window.swell);
  return (
    <article className="ocean-row rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6b7d84]">Time</p>
          <p className="mt-1 text-base font-semibold leading-snug text-[#102b3a] sm:text-lg">{window.label}</p>
        </div>
        <div className={getReadClass(window.read)}>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] opacity-65">Condition</p>
          <p className="mt-0.5 text-base font-semibold">{window.read}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_1fr] lg:grid-cols-[1.2fr_1fr_0.85fr_0.85fr]">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-800/10 bg-cyan-50/55 px-3 py-3">
          <WindArrow degrees={window.windDegrees} />
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-cyan-900/65">Wind</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-2xl font-semibold leading-none text-cyan-950">{window.windDirection}</span>
              <span className="text-base font-semibold text-[#102b3a]">{window.wind}</span>
              <span className="rounded-full border border-amber-700/15 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">gust {window.gust}</span>
            </div>
          </div>
        </div>
        <ForecastMetric icon={Waves} label="Bumps / sea" value={swell.height} detail={`${swell.period} · ${swell.direction}`} tone="swell" />
        <ForecastMetric icon={Fish} label="Tide" value={capitalize(window.tide)} tone="tide" />
        <ForecastMetric icon={CloudRain} label="Rain" value={window.rain} detail="risk" tone="rain" />
      </div>
    </article>
  );
}

function SourceFreshnessBadge({ source }: { source: { source: string; status: string; freshnessMinutes?: number; observedAt?: string } }) {
  const freshness = source.freshnessMinutes !== undefined ? `${source.freshnessMinutes} min` : source.observedAt ? formatTime(source.observedAt) : "updated";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e0e3] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f7078]">
      <span className="live-pulse size-2 rounded-full bg-emerald-500" />
      {source.status === "live" ? "Live" : "Sample"} · {freshness}
    </span>
  );
}

function CategoryPill({ label, tone }: { label: string; tone: "wind" | "gust" | "swell" | "tide" | "rain" | "alert" }) {
  const classes = {
    wind: "border-cyan-700/15 bg-cyan-50 text-cyan-800",
    gust: "border-amber-700/15 bg-amber-50 text-amber-800",
    swell: "border-blue-700/15 bg-blue-50 text-blue-800",
    tide: "border-indigo-700/15 bg-indigo-50 text-indigo-800",
    rain: "border-teal-700/15 bg-teal-50 text-teal-800",
    alert: "border-orange-700/20 bg-orange-50 text-orange-800",
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${classes[tone]}`}>{label}</span>;
}

function LiveWindBlock({ label, wind }: { label: string; wind: WindDisplay }) {
  return (
    <div className="rounded-2xl border border-cyan-800/10 bg-cyan-50/55 p-5">
      <div className="flex items-center gap-4">
        <WindArrow degrees={wind.degrees} large />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill label="Wind" tone="wind" />
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-900/70">{label}</span>
          </div>
          <div className="mt-3">
            <p className="text-5xl font-semibold leading-none text-cyan-950">{wind.direction}</p>
            <p className="mt-2 text-2xl font-semibold text-[#102b3a]">{wind.speed}</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
            <span>GUST</span>
            <span>{wind.gust}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status, live = false }: { status: string; live?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e0e3] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#4f626a]">
      {live ? <span className="live-pulse size-2 rounded-full bg-[#0d5968]" /> : null}
      {status}
    </span>
  );
}

type WindDisplay = {
  direction: string;
  speed: string;
  gust: string;
  degrees: number;
  isSample: boolean;
};

function WindArrow({ degrees, large = false }: { degrees: number; large?: boolean }) {
  return (
    <span className={large ? "grid size-14 shrink-0 place-items-center" : "grid size-9 shrink-0 place-items-center"}>
      <ArrowUp
        className={large ? "size-10 text-[#0d5968]" : "size-7 text-[#0d5968]"}
        style={{ transform: `rotate(${degrees + 180}deg)` }}
        aria-hidden
      />
    </span>
  );
}

function getLiveStatus(snapshot: OceanConditionSnapshot) {
  return snapshot.sources.some((source) => source.status === "live") ? "Live NOAA data" : "Fallback data";
}

function getWindDisplay(snapshot: OceanConditionSnapshot, fallback: Omit<WindDisplay, "isSample">): WindDisplay {
  if (snapshot.wind.speedKt === null || snapshot.wind.source.status !== "live") {
    return { ...fallback, isSample: true };
  }

  return {
    direction: snapshot.wind.directionCardinal ?? fallback.direction,
    speed: `${snapshot.wind.speedKt} kt`,
    gust: snapshot.wind.gustKt !== null ? `${snapshot.wind.gustKt} kt` : fallback.gust,
    degrees: snapshot.wind.directionDeg ?? fallback.degrees,
    isSample: false,
  };
}

function formatSwell(snapshot: OceanConditionSnapshot) {
  if (snapshot.swell.heightFt === null) return "Swell not available";
  return `${snapshot.swell.heightFt} ft @ ${snapshot.swell.dominantPeriodSec ?? "-"}s ${snapshot.swell.directionCardinal ?? ""}`;
}

function formatRain(snapshot: OceanConditionSnapshot) {
  const rain = snapshot.forecastWindows[0]?.precipitationChancePercent;
  return rain === null || rain === undefined ? "Rain not available" : `${rain}%`;
}

function buildOceanRead(activity: Activity, zone: Zone, snapshot: OceanConditionSnapshot, score: RouteScore, wind: WindDisplay) {
  const swell = parseSwell(formatSwell(snapshot));
  const gustNumber = Number.parseInt(wind.gust, 10);
  const rain = formatRain(snapshot);
  const rainNumber = Number.parseInt(rain, 10);
  const route = activity === "downwind" ? (zone === "windward" ? "Maliko line" : "south side run") : `${getZoneLabel(zone).toLowerCase()} fishing`;
  const gustText = Number.isFinite(gustNumber) && gustNumber >= 28 ? "gusts are punchy" : "gust spread looks manageable";
  const rainText = Number.isFinite(rainNumber) && rainNumber >= 30 ? `${rain} rain risk could make bumps messier` : `${rain} rain risk is less of a limiter`;
  const crossingText = getCrossingSwellNote(wind, swell.direction).toLowerCase();
  const tideText = snapshot.tide.trend === "falling" ? "Falling tide may affect harbor entry." : `${capitalize(snapshot.tide.trend)} tide is part of the read.`;

  if (score.runQualityScore >= 70) {
    return `${wind.direction} ${wind.speed} is enough for the ${route}, but ${rainText} and ${crossingText}. ${capitalize(gustText)}.`;
  }

  if (score.runQualityScore >= 45) {
    return `${wind.direction} ${wind.speed} can work, but the ${route} needs a cleaner window. Watch ${rain} rain risk and ${swell.direction} swell crossing the wind line.`;
  }

  return `The ${route} looks marginal right now. Wind is ${wind.direction} ${wind.speed}, sea state is ${swell.height} @ ${swell.period}, and ${tideText}`;
}

function buildDownwindRead(zone: Zone, snapshot: OceanConditionSnapshot, score: RouteScore, wind: WindDisplay) {
  const swell = parseSwell(formatSwell(snapshot));
  const gustNumber = Number.parseInt(wind.gust, 10);
  const rain = formatRain(snapshot);
  const route = zone === "windward" ? "Maliko line" : "south side run";
  const alignment = getSwellAlignment(wind, swell.direction).toLowerCase();
  const gustText = Number.isFinite(gustNumber) && gustNumber >= 28 ? "Gusts near 30 kt make it punchy." : "Gust spread looks manageable.";
  const windowText = score.bestLaunchWindow ? `Best raw window starts around ${formatTime(score.bestLaunchWindow.startTime)}.` : "Launch window is not available yet.";

  if (score.runQualityScore >= 70) {
    return `${wind.direction} ${wind.speed} is enough for the ${route}. Bumps look ${alignment} with ${swell.height} @ ${swell.period} from ${swell.direction}. ${gustText} ${windowText}`;
  }

  if (score.runQualityScore >= 45) {
    return `${wind.direction} ${wind.speed} can work, but bumps may be uneven. ${getCrossingSwellNote(wind, swell.direction)} ${rain} rain risk could affect wind quality. ${windowText}`;
  }

  return `${getZoneLabel(zone)} downwind looks marginal. Wind is ${wind.direction} ${wind.speed}, bumps are ${swell.height} @ ${swell.period}, and the finish needs a tide/harbor check.`;
}

function buildFishingRead(zone: Zone, snapshot: OceanConditionSnapshot, wind: WindDisplay) {
  const swell = parseSwell(formatSwell(snapshot));
  const rain = formatRain(snapshot);
  const exposedNote = zone === "windward" ? "exposed water will carry more chop" : "protected water should be more comfortable";
  const alertNote = snapshot.alerts.length ? `${snapshot.alerts.length} marine alert active.` : "No active marine alert in current data.";
  return `Fishable on protected sides. ${wind.direction} ${wind.speed} means ${exposedNote}, with ${swell.height} open-ocean seas and ${snapshot.tide.trend} tide creating ${getDriftQuality(wind, snapshot).toLowerCase()} drift. Watch ${rain} rain/squall risk. ${alertNote}`;
}

function getSwellAlignment(wind: WindDisplay, swellDirection: string) {
  const diff = directionDifference(wind.degrees, cardinalToDegrees(swellDirection));
  if (diff <= 30) return "Lined up";
  if (diff <= 60) return "Slight cross";
  return "Crossing";
}

function getCrossingSwellNote(wind: WindDisplay, swellDirection: string) {
  const alignment = getSwellAlignment(wind, swellDirection);
  if (alignment === "Lined up") return "Swell is mostly lined up with the wind line.";
  if (alignment === "Slight cross") return "Swell is slightly crossing the wind line.";
  return "Swell is crossing the wind line and may make bumps messier.";
}

function getRainImpact(snapshot: OceanConditionSnapshot) {
  const rainNumber = Number.parseInt(formatRain(snapshot), 10);
  if (Number.isFinite(rainNumber) && rainNumber >= 40) return "Elevated squall risk";
  if (Number.isFinite(rainNumber) && rainNumber >= 25) return "Watch passing bands";
  return "Lower rain impact";
}

function getDriftQuality(wind: WindDisplay, snapshot: OceanConditionSnapshot) {
  const speed = Number.parseInt(wind.speed, 10);
  if (snapshot.tide.trend === "falling" && speed >= 10 && speed <= 20) return "Steady";
  if (speed > 22) return "Fast / choppy";
  if (speed < 8) return "Light";
  return "Moderate";
}

function getSeaComfort(height: string, zone: Zone) {
  const feet = Number.parseFloat(height);
  if (!Number.isFinite(feet)) return "Unknown";
  if (zone === "leeward" && feet <= 4) return "Comfortable";
  if (feet <= 3.5) return "Comfortable";
  if (feet <= 6) return "Manageable";
  return "Exposed";
}

function directionDifference(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function buildForecastWindows(snapshot: OceanConditionSnapshot): ForecastWindowView[] {
  const swell = formatSwell(snapshot);
  const liveWindows = snapshot.forecastWindows.slice(0, 5).map((window) => {
    const direction = window.windDirectionCardinal ?? "E";
    const windSpeed = window.windSpeedKt !== null ? `${window.windSpeedKt} kt` : "-";
    const gust = window.windGustKt !== null ? `${window.windGustKt} kt` : "-";
    return {
      label: formatTimeRange(window.startTime, window.endTime),
      wind: windSpeed,
      gust,
      windDirection: direction,
      windDegrees: window.windDirectionDeg ?? cardinalToDegrees(direction),
      swell,
      tide: snapshot.tide.trend,
      rain: window.precipitationChancePercent !== null ? `${window.precipitationChancePercent}%` : "-",
      read: classifyWindow(window.windSpeedKt, window.windGustKt, window.precipitationChancePercent),
    };
  });

  if (liveWindows.length >= 3) return liveWindows;

  const fallbackWindows = buildThreeDayForecast(snapshot.forecastWindows, "windward").map((day) => {
    const wind = parseWind(day.wind);
    return {
      label: day.day,
      wind: wind.speed,
      gust: wind.gust,
      windDirection: wind.direction,
      windDegrees: cardinalToDegrees(wind.direction),
      swell: day.swell,
      tide: snapshot.tide.trend,
      rain: day.rain,
      read: classifyWindow(Number.parseInt(wind.speed, 10), Number.parseInt(wind.gust, 10), Number.parseInt(day.rain, 10)),
    };
  });

  return [...liveWindows, ...fallbackWindows].slice(0, 3);
}

function classifyWindow(windSpeed: number | null, gust: number | null, rain: number | null): WindowCall {
  if (windSpeed === null) return "Mixed";
  if (windSpeed >= 18 && windSpeed <= 28 && (gust ?? 0) <= 35 && (rain ?? 0) < 40) return "Solid";
  if (windSpeed < 10 || windSpeed > 32 || (rain ?? 0) >= 55) return "Heavy";
  return "Mixed";
}

function getReadClass(read: WindowCall) {
  if (read === "Solid") return "rounded-xl border border-teal-800/10 bg-teal-50/80 px-3 py-2 text-teal-950";
  if (read === "Mixed") return "rounded-xl border border-amber-800/10 bg-amber-50/80 px-3 py-2 text-amber-950";
  return "rounded-xl border border-orange-800/15 bg-orange-50/85 px-3 py-2 text-orange-950";
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function buildThreeDayForecast(windows: ForecastWindow[], zone: Zone) {
  const fallback = buildFallbackForecast(zone);
  if (windows.length < 6) return fallback;

  const grouped = new Map<string, ForecastWindow[]>();
  for (const window of windows) {
    const label = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Pacific/Honolulu" }).format(new Date(window.startTime));
    grouped.set(label, [...(grouped.get(label) ?? []), window]);
  }

  const days = Array.from(grouped.entries()).slice(0, 3).map(([day, dayWindows]) => {
    const windValues = dayWindows.map((window) => window.windSpeedKt).filter((value): value is number => value !== null);
    const gustValues = dayWindows.map((window) => window.windGustKt).filter((value): value is number => value !== null);
    const rainValues = dayWindows.map((window) => window.precipitationChancePercent).filter((value): value is number => value !== null);
    const direction = dayWindows.find((window) => window.windDirectionCardinal)?.windDirectionCardinal ?? "-";
    return {
      day,
      wind: `${direction} ${range(windValues)} kt${gustValues.length ? ` G${Math.max(...gustValues)}` : ""}`,
      swell: zone === "windward" ? fallback[0].swell : "2-4 ft @ 12s SSW",
      rain: rainValues.length ? `${Math.round(rainValues.reduce((sum, value) => sum + value, 0) / rainValues.length)}%` : "-",
      read: dayWindows[0]?.shortForecast ?? "Forecast available.",
    };
  });

  while (days.length < 3) {
    days.push(fallback[days.length]);
  }

  return days.length ? days : fallback;
}

function range(values: number[]) {
  if (!values.length) return "-";
  return `${Math.min(...values)}-${Math.max(...values)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Pacific/Honolulu", timeZoneName: "short" }).format(new Date(value));
}

function formatTimeRange(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const startLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Pacific/Honolulu" }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Pacific/Honolulu", timeZoneName: "short" }).format(end);
  return `${startLabel}-${endLabel}`;
}

function parseWind(value: string) {
  const direction = value.match(/^[A-Z]+/)?.[0] ?? "E";
  const speed = value.match(/[A-Z]+\s+([^G]+?kt)/)?.[1]?.trim() ?? value.replace(direction, "").trim();
  const gust = value.match(/G(\d+)/)?.[1];
  return {
    direction,
    speed,
    gust: gust ? `${gust} kt` : "-",
  };
}

function parseSwell(value: string) {
  const height = value.match(/([\d.-]+\s*ft)/)?.[1] ?? "-";
  const period = value.match(/@\s*([\d.-]+s)/)?.[1] ?? "-";
  const direction = value.match(/([A-Z]{1,3})\s*$/)?.[1] ?? "-";
  return { height, period, direction };
}

function cardinalToDegrees(direction: string) {
  const map: Record<string, number> = {
    N: 0,
    NNE: 23,
    NE: 45,
    ENE: 68,
    E: 90,
    ESE: 113,
    SE: 135,
    SSE: 158,
    S: 180,
    SSW: 203,
    SW: 225,
    WSW: 248,
    W: 270,
    WNW: 293,
    NW: 315,
    NNW: 338,
  };
  return map[direction] ?? 90;
}

function ZoneChip({ zone, active, href }: { zone: Zone; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={active ? "rounded-full border border-[#102b3a] bg-[#102b3a] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(16,43,58,0.12)]" : "rounded-full border border-[#d7e0e3] bg-white/70 px-4 py-2 text-sm font-semibold text-[#102b3a] transition hover:border-[#102b3a] hover:bg-white"}
    >
      {getZoneLabel(zone)}
    </Link>
  );
}

function getZoneLabel(zone: Zone) {
  return zone === "windward" ? "Windward" : "Leeward";
}

function getZoneWind(snapshot: OceanConditionSnapshot, zone: Zone) {
  const fallback = zone === "windward"
    ? { direction: "ENE", speed: "18-24 kt", gust: "30 kt", degrees: 68 }
    : { direction: "ESE", speed: "10-16 kt", gust: "22 kt", degrees: 113 };
  return getWindDisplay(snapshot, fallback);
}

function normalizeZone(value: string | string[] | undefined): Zone {
  return value === "leeward" ? "leeward" : "windward";
}

export { normalizeZone };

function buildFallbackForecast(zone: Zone) {
  const windward = [
    { wind: "ENE 20-25 kt", swell: "5-6 ft @ 10s ENE", rain: "25%", read: "Trades active. Watch passing windward showers." },
    { wind: "E 18-24 kt", swell: "4-6 ft @ 9s E", rain: "30%", read: "Similar trades with moderate wind texture." },
    { wind: "ESE 14-20 kt", swell: "3-5 ft @ 10s E", rain: "20%", read: "Slightly lighter wind, cleaner water possible." },
  ];
  const leeward = [
    { wind: "ESE 10-16 kt", swell: "2-4 ft @ 12s SSW", rain: "15%", read: "Lighter leeward wind with afternoon texture." },
    { wind: "E 12-18 kt", swell: "2-3 ft @ 11s S", rain: "20%", read: "Moderate trades wrapping leeward." },
    { wind: "SE 8-14 kt", swell: "2-3 ft @ 13s SSW", rain: "15%", read: "Lighter wind, cleaner morning window possible." },
  ];
  const source = zone === "windward" ? windward : leeward;
  const today = new Date();

  return source.map((day, index) => ({
    ...day,
    day: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Pacific/Honolulu" }).format(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + index),
    ),
  }));
}
