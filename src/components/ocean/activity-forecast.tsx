import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowUp,
  CloudRain,
  Compass,
  Navigation,
  Radio,
  Waves,
} from "lucide-react";

import { LiveCameraCard, type LiveCameraCardProps } from "@/components/ocean/live-camera-card";
import type {
  ForecastWindow,
  HarborWindObservation,
  OceanConditionSnapshot,
} from "@/lib/ocean";

type ObservationMode = "shores" | "channels" | "harbors";
type Activity = ObservationMode | "downwind" | "fishing";
type Zone = "windward" | "leeward";
type Shore = "north" | "south" | "west";
type WindTone = "light" | "clean" | "medium" | "strong" | "wild";
type SourceLike = {
  source: string;
  status: string;
  stationId?: string;
  freshnessMinutes?: number;
  observedAt?: string;
  fetchedAt?: string;
};

export function ActivityForecastPage({
  activity,
  selectedZone,
  selectedShore = "north",
  snapshot,
}: {
  activity: Activity;
  selectedZone: Zone;
  selectedShore?: Shore;
  snapshot: OceanConditionSnapshot;
}) {
  const mode = normalizeMode(activity);
  const shores: Shore[] = ["north", "south", "west"];
  const activeShore = getShoreConfig(selectedShore);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {mode === "shores" ? (
        <div className="flex gap-2">
          {shores.map((shore) => (
            <ShoreChip
              key={shore}
              shore={shore}
              active={shore === selectedShore}
              href={`/shores?shore=${shore}`}
            />
          ))}
        </div>
      ) : null}
      <section className="ocean-card rounded-[1.5rem] border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f626a]">
              {getModeKicker(mode, activeShore)}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#102b3a]">
              {getModeTitle(mode, activeShore)}
            </h2>
          </div>
          <StatusPill status={getLiveStatus(snapshot)} live />
        </div>
        {mode === "shores" ? (
          <ShoresMode
            shore={activeShore}
            zoneWind={getZoneWind(snapshot, activeShore.zone)}
            snapshot={snapshot}
          />
        ) : mode === "channels" ? (
          <ChannelsMode
            zoneWind={getZoneWind(snapshot, selectedZone)}
            snapshot={snapshot}
          />
        ) : (
          <HarborsMode snapshot={snapshot} />
        )}
      </section>
    </div>
  );
}

export function HomeForecastOverview({
  snapshot,
  selectedShore = "north",
}: {
  snapshot: OceanConditionSnapshot;
  selectedShore?: Shore;
}) {
  const shores: Shore[] = ["north", "south", "west"];
  const shore = getShoreConfig(selectedShore);
  const wind = getZoneWind(snapshot, shore.zone);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {shores.map((item) => (
          <ShoreChip
            key={item}
            shore={item}
            active={item === selectedShore}
            href={`/home?shore=${item}`}
          />
        ))}
      </div>

      <section className="hero-ocean ocean-card overflow-hidden rounded-[1.5rem] border p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f626a]">
              {shore.secondary}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#102b3a]">
              {shore.label} live ocean
            </h1>
          </div>
          <StatusPill status={getLiveStatus(snapshot)} live />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <LiveWindCard wind={wind} snapshot={snapshot} />
          <LiveSeaInlineCard snapshot={snapshot} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <TideCard snapshot={snapshot} />
          <CurrentCard snapshot={snapshot} />
          <RainRiskCard snapshot={snapshot} />
        </div>
      </section>

      <LiveOceanSection snapshot={snapshot} />
    </div>
  );
}

export function ExtendedForecastOverview({
  selectedZone,
  snapshot,
}: {
  selectedZone: Zone;
  snapshot: OceanConditionSnapshot;
}) {
  const zones: Zone[] = ["windward", "leeward"];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex gap-2">
        {zones.map((zone) => (
          <ZoneChip
            key={zone}
            zone={zone}
            active={zone === selectedZone}
            href={`/forecast?zone=${zone}`}
          />
        ))}
      </div>
      <section className="ocean-card rounded-[1.5rem] border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-[#102b3a]">
              Forecast Models
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7078]">
              Lightweight model timeline. Live observations remain primary.
            </p>
          </div>
          <StatusPill status="Model timeline" />
        </div>
        <div className="mt-5">
          <ModelTimeline snapshot={snapshot} zone={selectedZone} />
        </div>
      </section>
    </div>
  );
}

function ShoresMode({
  shore,
  zoneWind,
  snapshot,
}: {
  shore: ShoreConfig;
  zoneWind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  const bumpEnergy = formatSeaEnergy(snapshot.bumpEnergy);
  const groundswell = formatSeaEnergy(snapshot.groundswell);
  const energyDirection = snapshot.bumpEnergy.directionCardinal ?? snapshot.swell.directionCardinal ?? "dir -";

  return (
    <div className="mt-6 space-y-5">
      <div>
        <SectionKicker title={`${shore.label} live observations`} />
        <div className="mt-4">
          <LiveWindBlock label="Wind now" wind={zoneWind} />
        </div>
        <LiveDataList
          className="mt-4"
          items={[
            {
              icon: Waves,
              label: "Bump energy",
              tone: "swell",
              primary: bumpEnergy.height,
              secondary: `${bumpEnergy.period} · ${bumpEnergy.direction} · 4-9s wind sea`,
              source: snapshot.bumpEnergy.source,
            },
            {
              icon: Waves,
              label: "Groundswell",
              tone: "swell",
              primary: groundswell.height,
              secondary: `${groundswell.period} · ${groundswell.direction} · long-period`,
              source: snapshot.groundswell.source,
            },
            {
              icon: Navigation,
              label: "Wind / swell angle",
              tone: "swell",
              primary: getSwellAlignment(zoneWind, energyDirection),
              secondary: `${energyDirection} sea energy vs ${zoneWind.direction} wind`,
              source: snapshot.swell.source,
            },
            {
              icon: CloudRain,
              label: "Rain bands",
              tone: "rain",
              primary: formatRain(snapshot),
              secondary: getRainImpact(snapshot),
              source: snapshot.forecastWindows[0]?.source,
            },
            {
              icon: Compass,
              label: "Current",
              tone: "current",
              primary: formatCurrent(snapshot),
              secondary: `${snapshot.current.trend} · ${snapshot.current.stationName}`,
              source: snapshot.current.source,
            },
          ]}
        />
      </div>
    </div>
  );
}

function ChannelsMode({
  zoneWind,
  snapshot,
}: {
  zoneWind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  return (
    <div className="mt-6 space-y-5">
      <ChannelWindsSection zoneWind={zoneWind} snapshot={snapshot} />
    </div>
  );
}

function HarborsMode({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  return (
    <div className="mt-6 space-y-5">
      <HarborWindsSection harbors={snapshot.harborWinds} snapshot={snapshot} />
    </div>
  );
}

function ModelTimeline({
  snapshot,
  zone = "windward",
}: {
  snapshot: OceanConditionSnapshot;
  zone?: Zone;
}) {
  const days = buildThreeDayForecast(snapshot.forecastWindows, zone);
  const bumpEnergy = formatSeaEnergy(snapshot.bumpEnergy);
  const groundswell = formatSeaEnergy(snapshot.groundswell);

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-[#094c60]/14 bg-white shadow-[0_14px_32px_rgba(8,74,92,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="px-4 py-3">
          <h2 className="text-xl font-semibold tracking-normal text-[#102b3a]">Model Timeline</h2>
          <p className="mt-1 text-sm font-medium text-[#61747c]">Compact wind, sea energy, tide, and rain model rows.</p>
        </div>
        <StatusPill status={getZoneLabel(zone)} />
      </div>
      <div className="border-t border-[#094c60]/10">
        {days.map((day) => {
          const wind = parseWind(day.wind);
          const tone = getWindToneFromText(wind.speed, wind.gust);
          return (
            <div
              key={day.day}
              className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-[#094c60]/10 px-4 py-3 last:border-b-0 sm:grid-cols-4 lg:grid-cols-[1.05fr_1fr_0.95fr_0.95fr_0.8fr_0.75fr_0.85fr] lg:items-center"
            >
              <TimelineCell label="Window" value={day.day} detail={day.read} />
              <TimelineWindCell wind={wind} tone={tone} />
              <TimelineCell label="Bump energy" value={bumpEnergy.height} detail={`${bumpEnergy.period} · ${bumpEnergy.direction}`} />
              <TimelineCell label="Groundswell" value={groundswell.height} detail={groundswell.meta} />
              <TimelineCell label="Tide" value={snapshot.tide.trend} detail={`${snapshot.tide.currentWaterLevelFt ?? "-"} ft`} />
              <TimelineCell label="Rain" value={day.rain} detail="probability" />
              <TimelineCell label="Source" value="NWS" detail={snapshot.forecastWindows[0]?.source.freshnessMinutes !== undefined ? `${snapshot.forecastWindows[0].source.freshnessMinutes} min` : "model"} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelineCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#6b7d84]">{label}</p>
      <p className="weather-data mt-1 truncate text-base leading-none text-[#102b3a] sm:text-lg">{value}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[#61747c]">{detail}</p>
    </div>
  );
}

function TimelineWindCell({ wind, tone }: { wind: ReturnType<typeof parseWind>; tone: WindTone }) {
  const classes = getWindToneClasses(tone);
  return (
    <div className="min-w-0">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#6b7d84]">Wind</p>
      <div className="mt-1 flex items-center gap-2">
        <WindArrow degrees={cardinalToDegrees(wind.direction)} className={classes.text} />
        <div className="min-w-0">
          <p className={`weather-data truncate text-xl leading-none ${classes.text}`}>{wind.direction}</p>
          <p className="weather-data mt-1 truncate text-sm text-[#102b3a]">{wind.speed} · gust {wind.gust}</p>
        </div>
      </div>
    </div>
  );
}

function SectionKicker({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-normal text-[#102b3a]">
        {title}
      </h3>
    </div>
  );
}

type LiveDataListItem = {
  icon: ElementType;
  label: string;
  tone: "wind" | "swell" | "tide" | "current" | "rain" | "alert";
  primary: string;
  secondary: string;
  meta?: string;
  source?: SourceLike;
};

function LiveDataList({
  items,
  className,
}: {
  items: LiveDataListItem[];
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[1.35rem] border border-[#094c60]/14 bg-white shadow-[0_14px_32px_rgba(8,74,92,0.08)] dark:border-white/12 dark:bg-[#091d2b] ${className ?? ""}`}>
      {items.map((item) => (
        <LiveDataRow key={`${item.label}-${item.primary}`} item={item} />
      ))}
    </div>
  );
}

function LiveDataRow({ item }: { item: LiveDataListItem }) {
  const Icon = item.icon;
  const toneClasses = {
    wind: "bg-[#ffe1d6] text-[#6f2717]",
    swell: "bg-[#dbeafe] text-[#0f2f5f]",
    tide: "bg-[#e0e7ff] text-[#263268]",
    current: "bg-[#dbeafe] text-[#173b6d]",
    rain: "bg-[#d7f3ee] text-[#0a463f]",
    alert: "bg-[#ffedd5] text-[#7c2d12]",
  };

  return (
    <div className={`border-b border-[#094c60]/10 px-4 py-4 last:border-b-0 ${toneClasses[item.tone]}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="size-5 shrink-0 opacity-80" />
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-70">
              {item.label}
            </p>
            <div className="mt-1 flex flex-col items-start gap-1">
              <p className="weather-data text-3xl leading-none">{item.primary}</p>
              <p className="text-sm font-semibold opacity-80">{item.secondary}</p>
              {item.meta ? (
                <p className="weather-data rounded-full border border-amber-700/15 bg-amber-50 px-2 py-0.5 text-xs uppercase tracking-[0.08em] text-amber-800">
                  {item.meta}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        {item.source ? <SourceFreshnessBadge source={item.source} /> : null}
      </div>
    </div>
  );
}

const liveOceanCameras: Array<LiveCameraCardProps & { id: string }> = [
  {
    id: "waiehu-cam",
    title: "Wind line check",
    location: "Waiehu",
    status: "live",
    timestamp: "",
    visualRead: "North-central coast texture and wind line verification.",
    tone: "north",
  },
  {
    id: "maliko-cam",
    title: "Launch texture",
    location: "Maliko",
    status: "live",
    timestamp: "",
    visualRead: "Useful for launch water, rain bands, and outside whitecaps.",
    tone: "north",
  },
  {
    id: "kihei-wailea-cam",
    title: "South side texture",
    location: "Kihei / Wailea",
    status: "live",
    timestamp: "",
    visualRead: "Leeward wind texture and south-side visibility check.",
    tone: "south",
  },
  {
    id: "harbor-cam",
    title: "Entry / exit check",
    location: "Harbor",
    status: "live",
    timestamp: "",
    visualRead: "Harbor cleanliness, chop, and entry visibility.",
    tone: "harbor",
  },
  {
    id: "molokai-coast-cam",
    title: "Crossing reference",
    location: "Molokai Coast",
    status: "live",
    timestamp: "",
    visualRead: "Channel horizon and outer island weather verification.",
    tone: "north",
  },
  {
    id: "hk-run-cam",
    title: "Run corridor",
    location: "HK Run",
    status: "live",
    timestamp: "",
    visualRead: "Surface energy check for the downwind corridor.",
    tone: "harbor",
  },
];

function LiveOceanSection({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  return (
    <section className="ocean-card rounded-[1.5rem] border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-[#0d5968]" />
            <h2 className="text-2xl font-semibold tracking-normal text-[#102b3a]">Live Ocean</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7078]">
            Visual confirmation for surface texture, rain bands, harbor cleanliness, and current ocean state.
          </p>
        </div>
        <StatusPill status="Visual checks" live />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {liveOceanCameras.map((camera) => (
          <LiveCameraCard key={camera.id} {...camera} timestamp={formatTime(snapshot.generatedAt)} />
        ))}
      </div>
    </section>
  );
}

function ChannelWindsSection({
  zoneWind,
  snapshot,
}: {
  zoneWind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  const pailoloWind = zoneWind;
  const kaiwiWind = getChannelWind("kaiwi", snapshot, zoneWind);

  return (
    <section>
      <SectionKicker title="Inter-island channels" />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ChannelWindCard
          name="Pailolo Channel"
          detail="Maui -> Molokai"
          wind={pailoloWind}
          source={getChannelSource("Pailolo Channel", snapshot)}
          snapshot={snapshot}
        />
        <ChannelWindCard
          name="Ka'iwi Channel"
          detail="Molokai -> Oahu"
          wind={kaiwiWind}
          source={getChannelSource("Kaiwi Channel", snapshot)}
          snapshot={snapshot}
        />
        <ChannelWindCard
          name="Alenuihaha Channel"
          detail="Maui -> Hawai'i"
          wind={getChannelWind("alenuihaha", snapshot, zoneWind)}
          source={getChannelSource("Alenuihaha Channel", snapshot)}
          snapshot={snapshot}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#5f7078]">
        Channel observations prioritize available live sources. NOAA marine zone references are shown for model context.
      </p>
    </section>
  );
}

function ChannelWindCard({
  name,
  detail,
  wind,
  source,
  snapshot,
}: {
  name: string;
  detail: string;
  wind: WindDisplay;
  source: SourceLike;
  snapshot: OceanConditionSnapshot;
}) {
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  const bumpEnergy = formatSeaEnergy(snapshot.bumpEnergy);
  return (
    <article className="ocean-card rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold uppercase leading-none tracking-[0.04em] text-[#102b3a]">{getChannelShortName(name)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7078]">
            {detail}
          </p>
        </div>
        <SourceFreshnessBadge source={source} />
      </div>
      <div className={`mt-4 flex items-center gap-4 rounded-2xl border p-4 ${classes.card}`}>
        <WindArrow degrees={wind.degrees} large className={classes.text} />
        <div>
          <p className={`weather-data text-5xl leading-none ${classes.text}`}>
            {wind.direction}
          </p>
          <p className="weather-data mt-2 text-2xl text-[#102b3a]">
            {wind.speed}
          </p>
          <p className={`mt-2 ${classes.badge} weather-data`}>gust {wind.gust}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ConditionMetric label="Bump energy" value={bumpEnergy.height} detail={`${bumpEnergy.period} · ${bumpEnergy.direction}`} />
        <ConditionMetric label="Current" value={formatCurrent(snapshot)} detail={snapshot.current.trend} />
        <ConditionMetric label="Tide influence" value={snapshot.tide.trend} detail={`${snapshot.tide.currentWaterLevelFt ?? "-"} ft`} />
        <ConditionMetric label="Rain / squalls" value={formatRain(snapshot)} detail={getRainImpact(snapshot)} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-[#536b73]">
        {getChannelContext(wind, bumpEnergy.height)}
      </p>
    </article>
  );
}

function ConditionMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[#094c60]/10 bg-white/55 px-3 py-2">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#536b73]">
        {label}
      </p>
      <p className="weather-data mt-1 text-lg leading-none text-[#102b3a]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#536b73]">{detail}</p>
    </div>
  );
}

function HarborWindsSection({
  harbors,
  snapshot,
}: {
  harbors: HarborWindObservation[];
  snapshot: OceanConditionSnapshot;
}) {
  return (
    <section>
      <SectionKicker title="Harbor conditions" />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {harbors.map((harbor) => (
          <HarborWindCard key={harbor.id} harbor={harbor} snapshot={snapshot} />
        ))}
      </div>
    </section>
  );
}

function HarborWindCard({
  harbor,
  snapshot,
}: {
  harbor: HarborWindObservation;
  snapshot: OceanConditionSnapshot;
}) {
  const wind = windObservationToDisplay(harbor.observation);
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  const bumpEnergy = formatSeaEnergy(snapshot.bumpEnergy);
  return (
    <article className="ocean-card rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold leading-tight text-[#102b3a]">{harbor.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#5f7078]">{harbor.side} side</p>
        </div>
        <SourceFreshnessBadge source={harbor.observation.source} />
      </div>
      <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${classes.card}`}>
        <div className="flex items-center gap-3">
          <WindArrow degrees={wind.degrees} className={classes.text} />
          <div>
            <p className={`weather-data text-4xl leading-none ${classes.text}`}>{wind.direction}</p>
            <p className="weather-data mt-1 text-xl text-[#102b3a]">{wind.speed}</p>
            <p className={`mt-2 ${classes.badge} weather-data`}>
              gust {wind.gust}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ConditionMetric label="Tide / current" value={formatCurrent(snapshot)} detail={`${snapshot.tide.trend} tide`} />
        <ConditionMetric label="Entry texture" value={bumpEnergy.height} detail={`${bumpEnergy.period} · ${bumpEnergy.direction}`} />
        <ConditionMetric label="Visibility / rain" value={formatRain(snapshot)} detail={getRainImpact(snapshot)} />
        <ConditionMetric label="Camera" value={getHarborCameraLabel(harbor)} detail="visual verification" />
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-[#536b73]">{getHarborContext(harbor, wind)}</p>
    </article>
  );
}

function windObservationToDisplay(wind: HarborWindObservation["observation"]): WindDisplay {
  return {
    direction: wind.directionCardinal ?? "DIR -",
    speed: wind.speedKt !== null ? `${wind.speedKt} kt` : "wind missing",
    gust: wind.gustKt !== null ? `${wind.gustKt} kt` : "-",
    degrees: wind.directionDeg ?? 90,
    isSample: wind.source.status !== "live",
  };
}

function LiveWindCard({
  wind,
  snapshot,
}: {
  wind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  return (
    <div className="ocean-card rounded-[1.35rem] border p-4 shadow-[0_16px_38px_rgba(8,74,92,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <CategoryPill label="Wind" tone="wind" />
        <SourceFreshnessBadge source={snapshot.wind.source} />
      </div>
      <div className={`mt-4 flex items-center gap-4 rounded-2xl border p-5 ${classes.card}`}>
        <WindArrow degrees={wind.degrees} large className={classes.text} />
        <div>
          <p className={`weather-data text-5xl leading-none tracking-normal ${classes.text}`}>
            {wind.direction}
          </p>
          <p className="weather-data mt-2 text-2xl text-[#102b3a]">
            {wind.speed}
          </p>
          <p className={`mt-2 ${classes.badge} weather-data`}>
            gust {wind.gust}
          </p>
        </div>
      </div>
      <p className={`mt-4 text-xs font-medium ${classes.muted}`}>
        Wind arrow shows flow coming from {wind.direction}.
      </p>
    </div>
  );
}

function LiveSeaInlineCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const bumpEnergy = formatSeaEnergy(snapshot.bumpEnergy);
  const groundswell = formatSeaEnergy(snapshot.groundswell);

  return (
    <section className="rounded-[1.35rem] border border-blue-800/18 bg-[#dbeafe] p-5 shadow-[0_12px_28px_rgba(8,74,92,0.08)] dark:border-blue-200/20 dark:bg-[#0c2940]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 pt-1">
          <Waves className="size-5 text-blue-700" />
          <CategoryPill label="Sea energy" tone="swell" />
        </div>
        <SourceFreshnessBadge source={snapshot.swell.source} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-900/15 bg-white/70 p-4 dark:border-blue-200/15 dark:bg-[#102f46]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-900/65">
            Bumps / wind sea
          </p>
          <p className="weather-data mt-2 text-4xl leading-none text-blue-950">
            {bumpEnergy.height}
          </p>
          <p className="weather-data mt-2 text-lg text-blue-950">
            {bumpEnergy.period} · {bumpEnergy.direction}
          </p>
          <p className="mt-2 text-xs font-semibold text-blue-900/65">
            4-9s short-period energy
          </p>
        </div>
        <div className="rounded-2xl border border-blue-900/12 bg-white/55 p-4 dark:border-blue-200/12 dark:bg-[#102f46]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-900/60">
            Groundswell
          </p>
          <p className="weather-data mt-2 text-3xl leading-none text-blue-950">
            {groundswell.height}
          </p>
          <p className="weather-data mt-2 text-base text-blue-950">
            {groundswell.meta}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-blue-900/75">
        Bump energy is open-ocean wind-sea texture, separated from longer-period groundswell.
      </p>
    </section>
  );
}

function CurrentCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  return (
    <section className="ocean-card rounded-[1.5rem] border border-blue-800/18 bg-[#dbeafe] p-5 dark:border-blue-200/20 dark:bg-[#0c2940]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="size-5 text-blue-700" />
          <CategoryPill label="Current" tone="tide" />
        </div>
        <SourceFreshnessBadge source={snapshot.current.source} />
      </div>
      <p className="weather-data mt-5 text-4xl leading-none text-blue-950">
        {formatCurrent(snapshot)}
      </p>
      <p className="mt-3 text-sm capitalize leading-6 text-blue-900/75">
        {snapshot.current.trend} · {snapshot.current.stationName}
      </p>
    </section>
  );
}

function TideCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const next =
    snapshot.tide.trend === "rising"
      ? snapshot.tide.nextHigh
      : snapshot.tide.nextLow;
  return (
    <section className="ocean-card rounded-[1.5rem] border border-indigo-800/18 bg-[#e0e7ff] p-5 dark:border-indigo-200/20 dark:bg-[#162542]">
      <div className="flex items-start justify-between gap-3">
        <CategoryPill label="Tide" tone="tide" />
        <SourceFreshnessBadge source={snapshot.tide.source} />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-900/60">
            Trend
          </p>
          <p className="weather-data mt-1 text-4xl capitalize leading-none text-indigo-950">
            {snapshot.tide.trend}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-900/60">
            Current
          </p>
          <p className="weather-data mt-1 text-2xl text-indigo-950">
            {snapshot.tide.currentWaterLevelFt ?? "-"} ft
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-indigo-900/75">
        Next {next?.type ?? "tide"}{" "}
        {next
          ? `${formatTime(next.time)} · ${next.heightFt} ft`
          : "not available"}
        . Falling/slack tide tends to be easier around harbor entries.
      </p>
    </section>
  );
}

function RainRiskCard({ snapshot }: { snapshot: OceanConditionSnapshot }) {
  const rain = formatRain(snapshot);
  const rainNumber = Number.parseInt(rain, 10);
  const impact =
    Number.isFinite(rainNumber) && rainNumber >= 35
      ? "Showers may disturb wind quality."
      : "Lower rain impact on wind quality.";
  return (
    <section className="ocean-card rounded-[1.5rem] border border-teal-800/18 bg-[#d7f3ee] p-5 dark:border-teal-200/20 dark:bg-[#0f302f]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudRain className="size-5 text-teal-700" />
          <CategoryPill label="Rain" tone="rain" />
        </div>
        {snapshot.forecastWindows[0]?.source ? (
          <SourceFreshnessBadge source={snapshot.forecastWindows[0].source} />
        ) : (
          <StatusPill status="Unavailable" />
        )}
      </div>
      <p className="weather-data mt-5 text-5xl leading-none text-teal-950">
        {rain}
      </p>
      <p className="mt-3 text-sm leading-6 text-teal-900/75">{impact}</p>
    </section>
  );
}

function SourceFreshnessBadge({
  source,
}: {
  source: SourceLike;
}) {
  const freshness =
    source.freshnessMinutes !== undefined
      ? `${source.freshnessMinutes} min`
      : source.observedAt
        ? formatTime(source.observedAt)
        : source.fetchedAt
          ? formatTime(source.fetchedAt)
          : "updated";
  const station = getSourceDisplayName(source);
  const isMarineZone = source.stationId?.startsWith("PHZ");
  const label = isMarineZone
    ? `${station} · ${source.status === "live" ? "LIVE" : "MODEL"}`
    : `${station} · ${freshness}`;
  return (
    <span className="inline-flex w-fit max-w-full items-center gap-2 justify-self-start rounded-full border border-[#cbd9dd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#3f5660] shadow-[0_4px_12px_rgba(7,35,45,0.06)] dark:border-white/15 dark:bg-[#132c3b] dark:text-[#d6e5ea]">
      <span className={`size-2 rounded-full ${source.status === "live" ? "live-pulse bg-emerald-500" : source.status === "mock" ? "bg-amber-500" : "bg-slate-400"}`} />
      <span className="truncate">
        {label}
      </span>
    </span>
  );
}

function getCompactSourceName(source: string) {
  if (source.includes("NDBC")) return "NDBC";
  if (source.includes("CO-OPS")) return "CO-OPS";
  if (source.includes("NWS")) return "NWS";
  if (source.includes("CWF")) return "CWF";
  return "SRC";
}

function getSourceDisplayName(source: SourceLike) {
  if (source.stationId === "51205") return "Pauwela";
  if (source.stationId) return source.stationId;
  return getCompactSourceName(source.source);
}

function CategoryPill({
  label,
  tone,
}: {
  label: string;
  tone: "wind" | "gust" | "swell" | "tide" | "rain" | "alert";
}) {
  const classes = {
    wind: "border-orange-800/20 bg-[#ffd7c7] text-[#7a2e1b]",
    gust: "border-amber-800/20 bg-[#fde68a] text-[#78350f]",
    swell: "border-blue-800/20 bg-[#bfdbfe] text-[#0f2f5f]",
    tide: "border-indigo-800/20 bg-[#c7d2fe] text-[#263268]",
    rain: "border-teal-800/20 bg-[#bfeee5] text-[#0a463f]",
    alert: "border-orange-800/25 bg-[#fed7aa] text-[#7c2d12]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${classes[tone]}`}
    >
      {label}
    </span>
  );
}

function LiveWindBlock({ label, wind }: { label: string; wind: WindDisplay }) {
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  return (
    <div className={`rounded-2xl border p-5 ${classes.card}`}>
      <div className="flex items-center gap-4">
        <WindArrow degrees={wind.degrees} large className={classes.text} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill label="Wind" tone="wind" />
            <span className={`text-xs font-semibold uppercase tracking-[0.1em] ${classes.muted}`}>
              {label}
            </span>
          </div>
          <div className="mt-3">
            <p className={`weather-data text-5xl leading-none ${classes.text}`}>
              {wind.direction}
            </p>
            <p className="weather-data mt-2 text-2xl text-[#102b3a]">
              {wind.speed}
            </p>
          </div>
          <div className={`mt-3 ${classes.badge}`}>
            <span>GUST</span>
            <span className="weather-data">{wind.gust}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  status,
  live = false,
}: {
  status: string;
  live?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#cbd9dd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#3f5660] shadow-[0_4px_12px_rgba(7,35,45,0.06)] dark:border-white/15 dark:bg-[#132c3b] dark:text-[#d6e5ea]">
      {live ? (
        <span className="live-pulse size-2 rounded-full bg-[#0d5968]" />
      ) : null}
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

function WindArrow({
  degrees,
  large = false,
  className = "text-[#0d5968]",
}: {
  degrees: number;
  large?: boolean;
  className?: string;
}) {
  return (
    <span
      className={
        large
          ? "grid size-14 shrink-0 place-items-center"
          : "grid size-9 shrink-0 place-items-center"
      }
    >
      <ArrowUp
        className={`${large ? "size-12" : "size-8"} ${className}`}
        strokeWidth={large ? 3.2 : 2.9}
        style={{ transform: `rotate(${degrees + 180}deg)` }}
        aria-hidden
      />
    </span>
  );
}

function getLiveStatus(snapshot: OceanConditionSnapshot) {
  return snapshot.sources.some((source) => source.status === "live")
    ? "Live NOAA data"
    : "Fallback data";
}

function getWindDisplay(
  snapshot: OceanConditionSnapshot,
  fallback: Omit<WindDisplay, "isSample">,
): WindDisplay {
  if (
    snapshot.wind.speedKt === null ||
    snapshot.wind.source.status !== "live"
  ) {
    return { ...fallback, isSample: true };
  }

  return {
    direction: snapshot.wind.directionCardinal ?? fallback.direction,
    speed: `${snapshot.wind.speedKt} kt`,
    gust:
      snapshot.wind.gustKt !== null
        ? `${snapshot.wind.gustKt} kt`
        : fallback.gust,
    degrees: snapshot.wind.directionDeg ?? fallback.degrees,
    isSample: false,
  };
}

function getChannelWind(
  channel: "kaiwi" | "alenuihaha",
  snapshot: OceanConditionSnapshot,
  fallback: WindDisplay,
): WindDisplay {
  if (channel === "kaiwi") {
    const rain = snapshot.forecastWindows[0]?.precipitationChancePercent ?? 0;
    const speed = rain >= 40 ? "22-28 kt" : "18-24 kt";
    const gust = rain >= 40 ? "34 kt" : "30 kt";
    return {
      direction: "ENE",
      speed,
      gust,
      degrees: 68,
      isSample: true,
    };
  }

  if (channel === "alenuihaha") {
    return {
      direction: "ENE",
      speed: "20-28 kt",
      gust: "34 kt",
      degrees: 68,
      isSample: true,
    };
  }

  return fallback;
}

function getChannelSource(channel: "Pailolo Channel" | "Kaiwi Channel" | "Alenuihaha Channel", snapshot: OceanConditionSnapshot): SourceLike {
  const zone =
    channel === "Pailolo Channel"
      ? "PHZ120"
      : channel === "Kaiwi Channel"
        ? "PHZ116"
        : "PHZ121";
  const fallbackSource = snapshot.forecastWindows[0]?.source ?? snapshot.wind.source;
  return {
    source: `NOAA HFO CWF · ${channel}`,
    status: fallbackSource.status === "live" ? "stale" : fallbackSource.status,
    stationId: zone,
    fetchedAt: fallbackSource.fetchedAt,
    observedAt: fallbackSource.observedAt,
    freshnessMinutes: fallbackSource.freshnessMinutes,
  };
}

function getChannelShortName(name: string) {
  return name.replace(" Channel", "");
}

function getChannelContext(wind: WindDisplay, bumpHeight: string) {
  const speed = extractMaxNumber(wind.speed) ?? 0;
  if (speed >= 22) return `Strong ${wind.direction} channel flow. Wind sea dominating the channel.`;
  if (bumpHeight !== "No separate bump partition") return "Short-period bumps active in the channel.";
  return "Channel state tied to live wind and available buoy energy.";
}

function getHarborContext(harbor: HarborWindObservation, wind: WindDisplay) {
  const speed = extractMaxNumber(wind.speed) ?? 0;
  if (speed >= 18) return `${harbor.name} has active harbor wind and likely chop near entries.`;
  return `${harbor.name} wind is lighter; verify entry texture with camera when available.`;
}

function formatSeaEnergy(energy: OceanConditionSnapshot["bumpEnergy"]) {
  const emptyLabel =
    energy.label === "groundswell"
      ? "No groundswell"
      : "No separate bump partition";
  const meta =
    energy.heightFt === null && energy.label === "groundswell"
      ? "wind sea dominant"
      : `${energy.periodSec !== null ? `${energy.periodSec}s` : "period -"} · ${energy.directionCardinal ?? "dir -"}`;
  return {
    height: energy.heightFt !== null ? `${energy.heightFt} ft` : emptyLabel,
    period: energy.periodSec !== null ? `${energy.periodSec}s` : "period -",
    direction: energy.directionCardinal ?? "dir -",
    meta,
  };
}

function formatCurrent(snapshot: OceanConditionSnapshot) {
  const speed = snapshot.current.speedKt !== null ? `${snapshot.current.speedKt} kt` : "speed -";
  const direction = snapshot.current.directionCardinal ?? "dir -";
  return `${speed} ${direction}`;
}

function formatRain(snapshot: OceanConditionSnapshot) {
  const rain = snapshot.forecastWindows[0]?.precipitationChancePercent;
  return rain === null || rain === undefined
    ? "Rain not available"
    : `${rain}%`;
}

function getSwellAlignment(wind: WindDisplay, swellDirection: string) {
  const diff = directionDifference(
    wind.degrees,
    cardinalToDegrees(swellDirection),
  );
  if (diff <= 30) return "Lined up";
  if (diff <= 60) return "Slight cross";
  return "Crossing";
}

function getRainImpact(snapshot: OceanConditionSnapshot) {
  const rainNumber = Number.parseInt(formatRain(snapshot), 10);
  if (Number.isFinite(rainNumber) && rainNumber >= 40)
    return "Elevated squall risk";
  if (Number.isFinite(rainNumber) && rainNumber >= 25)
    return "Watch passing bands";
  return "Lower rain impact";
}

function getWindToneFromText(speed: string, gust?: string): WindTone {
  const peak = Math.max(
    extractMaxNumber(speed) ?? 0,
    extractMaxNumber(gust ?? "") ?? 0,
  );
  if (peak >= 38) return "wild";
  if (peak >= 22) return "strong";
  if (peak >= 16) return "medium";
  if (peak >= 12) return "clean";
  return "light";
}

function getWindToneClasses(tone: WindTone) {
  const classes = {
    light: {
      card: "border-orange-900/18 bg-[#ffe8df] text-[#6f2717]",
      text: "text-[#6f2717]",
      muted: "text-orange-900/65",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-orange-900/18 bg-[#fff2ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f2717]",
    },
    clean: {
      card: "border-orange-900/20 bg-[#ffd7c7] text-[#7a2e1b]",
      text: "text-[#7a2e1b]",
      muted: "text-orange-900/65",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-orange-900/20 bg-[#ffe9df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a2e1b]",
    },
    medium: {
      card: "border-amber-900/25 bg-[#fde68a] text-[#78350f]",
      text: "text-[#78350f]",
      muted: "text-amber-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-amber-900/25 bg-[#fef3c7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#78350f]",
    },
    strong: {
      card: "border-orange-900/25 bg-[#ffc6b5] text-[#802515]",
      text: "text-[#802515]",
      muted: "text-orange-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-orange-900/25 bg-[#ffe1d6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#802515]",
    },
    wild: {
      card: "border-violet-900/25 bg-[#ddd6fe] text-[#3b0764]",
      text: "text-[#3b0764]",
      muted: "text-violet-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-violet-900/25 bg-[#ede9fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#3b0764]",
    },
  };
  return classes[tone];
}

function extractMaxNumber(value: string) {
  const values = [...value.matchAll(/\d+(?:\.\d+)?/g)].map((match) =>
    Number.parseFloat(match[0]),
  );
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length ? Math.max(...finiteValues) : null;
}

function directionDifference(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function buildThreeDayForecast(windows: ForecastWindow[], zone: Zone) {
  const fallback = buildFallbackForecast(zone);
  if (windows.length < 6) return fallback;

  const grouped = new Map<string, ForecastWindow[]>();
  for (const window of windows) {
    const label = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Pacific/Honolulu",
    }).format(new Date(window.startTime));
    grouped.set(label, [...(grouped.get(label) ?? []), window]);
  }

  const days = Array.from(grouped.entries())
    .slice(0, 3)
    .map(([day, dayWindows]) => {
      const windValues = dayWindows
        .map((window) => window.windSpeedKt)
        .filter((value): value is number => value !== null);
      const gustValues = dayWindows
        .map((window) => window.windGustKt)
        .filter((value): value is number => value !== null);
      const rainValues = dayWindows
        .map((window) => window.precipitationChancePercent)
        .filter((value): value is number => value !== null);
      const direction =
        dayWindows.find((window) => window.windDirectionCardinal)
          ?.windDirectionCardinal ?? "-";
      return {
        day,
        wind: `${direction} ${range(windValues)} kt${gustValues.length ? ` G${Math.max(...gustValues)}` : ""}`,
        swell: zone === "windward" ? fallback[0].swell : "2-4 ft @ 12s SSW",
        rain: rainValues.length
          ? `${Math.round(rainValues.reduce((sum, value) => sum + value, 0) / rainValues.length)}%`
          : "-",
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
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Pacific/Honolulu",
  }).format(new Date(value));
}

function parseWind(value: string) {
  const direction = value.match(/^[A-Z]+/)?.[0] ?? "E";
  const speed =
    value.match(/[A-Z]+\s+([^G]+?kt)/)?.[1]?.trim() ??
    value.replace(direction, "").trim();
  const gust = value.match(/G(\d+)/)?.[1];
  return {
    direction,
    speed,
    gust: gust ? `${gust} kt` : "-",
  };
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

function ZoneChip({
  zone,
  active,
  href,
}: {
  zone: Zone;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-[#092f3e] bg-[#092f3e] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(7,35,45,0.16)] dark:border-[#9debf9]/35 dark:bg-[#d8f6fb] dark:text-[#071723]"
          : "rounded-full border border-[#cbd9dd] bg-white px-4 py-2 text-sm font-semibold text-[#4a626b] transition hover:border-[#092f3e]/35 hover:text-[#102b3a] dark:border-white/12 dark:bg-[#102a3a] dark:text-[#c9d9df] dark:hover:border-[#9debf9]/35 dark:hover:text-white"
      }
    >
      {getZoneLabel(zone)}
    </Link>
  );
}

type ShoreConfig = {
  id: Shore;
  label: string;
  secondary: string;
  zone: Zone;
};

function ShoreChip({
  shore,
  active,
  href,
}: {
  shore: Shore;
  active: boolean;
  href: string;
}) {
  const config = getShoreConfig(shore);
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-[#092f3e] bg-[#092f3e] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(7,35,45,0.16)] dark:border-[#9debf9]/35 dark:bg-[#d8f6fb] dark:text-[#071723]"
          : "rounded-full border border-[#cbd9dd] bg-white px-4 py-2 text-sm font-semibold text-[#4a626b] transition hover:border-[#092f3e]/35 hover:text-[#102b3a] dark:border-white/12 dark:bg-[#102a3a] dark:text-[#c9d9df] dark:hover:border-[#9debf9]/35 dark:hover:text-white"
      }
    >
      {config.label}
    </Link>
  );
}

function getShoreConfig(shore: Shore): ShoreConfig {
  const configs: Record<Shore, ShoreConfig> = {
    north: { id: "north", label: "North Shore", secondary: "Windward", zone: "windward" },
    south: { id: "south", label: "South Side / Kihei", secondary: "Leeward", zone: "leeward" },
    west: { id: "west", label: "West Side", secondary: "Leeward", zone: "leeward" },
  };
  return configs[shore];
}

function getZoneLabel(zone: Zone) {
  return zone === "windward" ? "Windward" : "Leeward";
}

function normalizeMode(activity: Activity): ObservationMode {
  if (activity === "downwind") return "shores";
  if (activity === "fishing") return "channels";
  return activity;
}

function getModeKicker(mode: ObservationMode, shore: ShoreConfig) {
  if (mode === "shores") return shore.secondary;
  if (mode === "channels") return "Inter-island";
  return "Harbors";
}

function getModeTitle(mode: ObservationMode, shore: ShoreConfig) {
  if (mode === "shores") return `${shore.label} observations`;
  if (mode === "channels") return "Channel conditions";
  return "Harbor conditions";
}

function getZoneWind(snapshot: OceanConditionSnapshot, zone: Zone) {
  const fallback =
    zone === "windward"
      ? { direction: "ENE", speed: "18-24 kt", gust: "30 kt", degrees: 68 }
      : { direction: "ESE", speed: "10-16 kt", gust: "22 kt", degrees: 113 };
  return getWindDisplay(snapshot, fallback);
}

function normalizeZone(value: string | string[] | undefined): Zone {
  return value === "leeward" ? "leeward" : "windward";
}

function normalizeShore(value: string | string[] | undefined): Shore {
  if (value === "south" || value === "west") return value;
  return "north";
}

function getHarborCameraLabel(harbor: HarborWindObservation) {
  if (harbor.id.includes("kahului")) return "Harbor";
  if (harbor.id.includes("maalaea")) return "Kihei / Wailea";
  if (harbor.id.includes("lahaina") || harbor.id.includes("mala")) return "West Side";
  return "Camera check";
}

export { normalizeShore, normalizeZone };

function buildFallbackForecast(zone: Zone) {
  const windward = [
    {
      wind: "ENE 20-25 kt",
      swell: "5-6 ft @ 10s ENE",
      rain: "25%",
      read: "Trades active. Watch passing windward showers.",
    },
    {
      wind: "E 18-24 kt",
      swell: "4-6 ft @ 9s E",
      rain: "30%",
      read: "Similar trades with moderate wind texture.",
    },
    {
      wind: "ESE 14-20 kt",
      swell: "3-5 ft @ 10s E",
      rain: "20%",
      read: "Slightly lighter wind, cleaner water possible.",
    },
  ];
  const leeward = [
    {
      wind: "ESE 10-16 kt",
      swell: "2-4 ft @ 12s SSW",
      rain: "15%",
      read: "Lighter leeward wind with afternoon texture.",
    },
    {
      wind: "E 12-18 kt",
      swell: "2-3 ft @ 11s S",
      rain: "20%",
      read: "Moderate trades wrapping leeward.",
    },
    {
      wind: "SE 8-14 kt",
      swell: "2-3 ft @ 13s SSW",
      rain: "15%",
      read: "Lighter wind, cleaner morning window possible.",
    },
  ];
  const source = zone === "windward" ? windward : leeward;
  const today = new Date();

  return source.map((day, index) => ({
    ...day,
    day: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Pacific/Honolulu",
    }).format(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + index),
    ),
  }));
}
