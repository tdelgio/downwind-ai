import Link from "next/link";
import type { ElementType } from "react";
import {
  Anchor,
  ArrowUp,
  CloudRain,
  Navigation,
  Radio,
  ShieldAlert,
  Ship,
  Waves,
} from "lucide-react";

import { LiveCameraCard, type LiveCameraCardProps } from "@/components/ocean/live-camera-card";
import type {
  ForecastWindow,
  HarborWindObservation,
  OceanConditionSnapshot,
  RouteScore,
} from "@/lib/ocean";

type Activity = "downwind" | "fishing";
type Zone = "windward" | "leeward";
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
  snapshot,
}: {
  activity: Activity;
  selectedZone: Zone;
  snapshot: OceanConditionSnapshot;
}) {
  const zones: Zone[] = ["windward", "leeward"];
  const zoneLabel = getZoneLabel(selectedZone);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex gap-2">
        {zones.map((zone) => (
          <ZoneChip
            key={zone}
            zone={zone}
            active={zone === selectedZone}
            href={`/${activity}?zone=${zone}`}
          />
        ))}
      </div>
      <section className="ocean-card rounded-[1.5rem] border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f626a]">
              {zoneLabel}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#102b3a]">
              {zoneLabel}{" "}
              {activity === "downwind" ? "Downwind Read" : "Boats / Channels"}
            </h2>
          </div>
          <StatusPill status={getLiveStatus(snapshot)} live />
        </div>
        {activity === "downwind" ? (
          <DownwindMode
            zone={selectedZone}
            zoneWind={getZoneWind(snapshot, selectedZone)}
            snapshot={snapshot}
          />
        ) : (
          <FishingMode
            zone={selectedZone}
            zoneWind={getZoneWind(snapshot, selectedZone)}
            snapshot={snapshot}
          />
        )}
      </section>
    </div>
  );
}

export function HomeForecastOverview({
  snapshot,
  selectedZone = "windward",
}: {
  snapshot: OceanConditionSnapshot;
  selectedZone?: Zone;
}) {
  const wind = getZoneWind(snapshot, selectedZone);
  const swell = parseSwell(formatSwell(snapshot));
  const zones: Zone[] = ["windward", "leeward"];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex gap-2">
        {zones.map((zone) => (
          <ZoneChip
            key={zone}
            zone={zone}
            active={zone === selectedZone}
            href={`/home?zone=${zone}`}
          />
        ))}
      </div>
      <section className="hero-ocean ocean-card overflow-hidden rounded-[1.5rem] border p-6 sm:p-7">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <LiveWindCard wind={wind} snapshot={snapshot} />
          <LiveSeaInlineCard swell={swell} snapshot={snapshot} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TideCard snapshot={snapshot} />
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
              {getZoneLabel(selectedZone)} extended forecast
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7078]">
              Three-day outlook for wind, bumps, tide, rain, and the activity
              condition.
            </p>
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

function DownwindMode({
  zone,
  zoneWind,
  snapshot,
}: {
  zone: Zone;
  zoneWind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  const swell = parseSwell(formatSwell(snapshot));

  return (
    <div className="mt-6 space-y-5">
      <div>
        <SectionKicker title="How will the run feel?" />
        <div className="mt-4">
          <LiveWindBlock label="Wind now" wind={zoneWind} />
        </div>
        <LiveDataList
          className="mt-4"
          items={[
            {
              icon: Waves,
              label: "Bumps / sea",
              tone: "swell",
              primary: swell.height,
              secondary: `${swell.period} period · ${swell.direction} direction`,
              source: snapshot.swell.source,
            },
            {
              icon: Navigation,
              label: "Swell line",
              tone: "swell",
              primary: getSwellAlignment(zoneWind, swell.direction),
              secondary: `${swell.direction} swell vs ${zoneWind.direction} wind`,
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
              icon: Anchor,
              label: "Finish tide",
              tone: "tide",
              primary: snapshot.tide.trend,
              secondary: `Kahului ${snapshot.tide.currentWaterLevelFt ?? "-"} ft`,
              source: snapshot.tide.source,
            },
          ]}
        />
      </div>

      <div>
        <div className="mt-4">
          <ThreeDayForecastSection snapshot={snapshot} zone={zone} />
        </div>
      </div>
    </div>
  );
}

function FishingMode({
  zone,
  zoneWind,
  snapshot,
}: {
  zone: Zone;
  zoneWind: WindDisplay;
  snapshot: OceanConditionSnapshot;
}) {
  const swell = parseSwell(formatSwell(snapshot));

  return (
    <div className="mt-6 space-y-5">
      <div>
        <SectionKicker title="Boat conditions" />
        <LiveDataList
          className="mt-4"
          items={[
            {
              icon: Navigation,
              label: "Wind chop",
              tone: "wind",
              primary: zoneWind.direction,
              secondary: zoneWind.speed,
              meta: `gust ${zoneWind.gust}`,
              source: snapshot.wind.source,
            },
            {
              icon: Waves,
              label: "Sea state",
              tone: "swell",
              primary: swell.height,
              secondary: `${swell.period} · ${swell.direction}`,
              source: snapshot.swell.source,
            },
            {
              icon: Anchor,
              label: "Tide movement",
              tone: "tide",
              primary: snapshot.tide.trend,
              secondary: `${snapshot.tide.currentWaterLevelFt ?? "-"} ft current`,
              source: snapshot.tide.source,
            },
            {
              icon: CloudRain,
              label: "Rain / squalls",
              tone: "rain",
              primary: formatRain(snapshot),
              secondary: getRainImpact(snapshot),
              source: snapshot.forecastWindows[0]?.source,
            },
            {
              icon: ShieldAlert,
              label: "Marine alerts",
              tone: "alert",
              primary: snapshot.alerts.length ? `${snapshot.alerts.length} active` : "None active",
              secondary: snapshot.alerts[0]?.event ?? "No active warning in current data.",
              source: snapshot.alerts[0]?.source,
            },
          ]}
        />
      </div>

      <ChannelWindsSection zoneWind={zoneWind} snapshot={snapshot} />

      <HarborWindsSection harbors={snapshot.harborWinds} />

      <div>
        <SectionKicker title="3-day boat forecast" />
        <div className="mt-4">
          <ThreeDayForecastSection snapshot={snapshot} zone={zone} />
        </div>
      </div>
    </div>
  );
}

function ThreeDayForecastSection({
  snapshot,
  zone = "windward",
  compact = false,
}: {
  snapshot: OceanConditionSnapshot;
  zone?: Zone;
  compact?: boolean;
}) {
  const days = buildThreeDayForecast(snapshot.forecastWindows, zone);

  return (
    <section
      className={
        compact
          ? "ocean-card-soft rounded-[1.25rem] border p-4"
          : "ocean-card-soft rounded-[1.25rem] border p-5"
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className={
              compact
                ? "text-xl font-semibold tracking-normal text-[#102b3a]"
                : "text-2xl font-semibold tracking-normal text-[#102b3a]"
            }
          >
            3-day forecast
          </h2>
          <p className="mt-1 text-sm font-medium text-[#61747c]">
            Wind, bumps, and rain stacked by day.
          </p>
        </div>
        <StatusPill status={getZoneLabel(zone)} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {days.map((day) => {
          const wind = parseWind(day.wind);
          const swell = parseSwell(day.swell);
          const call = classifyWindow(
            extractMaxNumber(wind.speed),
            extractMaxNumber(wind.gust),
            extractMaxNumber(day.rain),
          );
          const tone = getWindToneFromText(wind.speed, wind.gust);
          return (
            <article
              key={day.day}
              className="rounded-[1.15rem] border border-[#094c60]/10 bg-white/65 p-4 shadow-[0_14px_34px_rgba(7,35,45,0.05)]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#094c60]/8 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7d84]">
                    {getZoneLabel(zone)}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#102b3a]">
                    {day.day}
                  </p>
                </div>
                <div className={getReadClass(call)}>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] opacity-65">
                    Condition
                  </p>
                  <p className="mt-0.5 text-base font-semibold">{call}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="overflow-hidden rounded-2xl border border-[#094c60]/10 bg-white/55">
                  <ForecastWindLine wind={wind} tone={tone} />
                  <ForecastMetricLine
                    icon={Waves}
                    label="Bumps / sea"
                    value={swell.height}
                    detail={`${swell.period} · ${swell.direction}`}
                    tone="swell"
                  />
                  <ForecastMetricLine
                    icon={CloudRain}
                    label="Rain"
                    value={day.rain}
                    detail="probability"
                    tone="rain"
                  />
                </div>
              </div>
              {!compact ? (
                <p className="mt-3 text-sm leading-6 text-[#6b7d84]">
                  {day.read}
                </p>
              ) : null}
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
      <h3 className="text-xl font-semibold tracking-normal text-[#102b3a]">
        {title}
      </h3>
    </div>
  );
}

type LiveDataListItem = {
  icon: ElementType;
  label: string;
  tone: "wind" | "swell" | "tide" | "rain" | "alert";
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
    <div className={`overflow-hidden rounded-[1.35rem] border border-[#094c60]/10 bg-white/60 shadow-[0_16px_38px_rgba(8,74,92,0.06)] ${className ?? ""}`}>
      {items.map((item) => (
        <LiveDataRow key={`${item.label}-${item.primary}`} item={item} />
      ))}
    </div>
  );
}

function LiveDataRow({ item }: { item: LiveDataListItem }) {
  const Icon = item.icon;
  const toneClasses = {
    wind: "bg-cyan-50/60 text-cyan-950",
    swell: "bg-blue-50/55 text-blue-950",
    tide: "bg-indigo-50/55 text-indigo-950",
    rain: "bg-teal-50/55 text-teal-950",
    alert: "bg-orange-50/65 text-orange-950",
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

function MiniStat({
  label,
  value,
  tone,
  featured = false,
}: {
  label: string;
  value: string;
  tone: "swell" | "wind" | "tide" | "rain";
  featured?: boolean;
}) {
  const toneClasses = {
    swell: "border-blue-800/10 bg-white/70 text-blue-950",
    wind: "border-cyan-800/10 bg-white/70 text-cyan-950",
    tide: "border-indigo-800/10 bg-white/70 text-indigo-950",
    rain: "border-teal-800/10 bg-white/70 text-teal-950",
  };
  return (
    <div className={`min-w-0 rounded-xl border px-2 sm:px-3 ${featured ? "py-4 text-center" : "py-2"} ${toneClasses[tone]}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] opacity-70">
        {label}
      </p>
      <p className={`weather-data mt-1 whitespace-nowrap leading-none ${featured ? "text-2xl sm:text-4xl" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function ForecastWindLine({
  wind,
  tone,
}: {
  wind: ReturnType<typeof parseWind>;
  tone: WindTone;
}) {
  const classes = getWindToneClasses(tone);
  return (
    <div className={`border-b border-[#094c60]/10 px-4 py-3 ${classes.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <WindArrow degrees={cardinalToDegrees(wind.direction)} className={classes.text} />
          <div>
            <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${classes.muted}`}>
              Wind
            </p>
            <div className="mt-1 flex flex-col items-start gap-1">
              <p className={`weather-data text-3xl leading-none ${classes.text}`}>
                {wind.direction}
              </p>
              <p className="weather-data text-lg text-[#102b3a]">
                {wind.speed}
              </p>
            </div>
          </div>
        </div>
        <span className={`${classes.badge} weather-data self-start`}>gust {wind.gust}</span>
      </div>
    </div>
  );
}

function ForecastMetricLine({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string;
  detail: string;
  tone: "swell" | "rain";
}) {
  const toneClasses = {
    swell: "text-blue-950",
    rain: "text-teal-950",
  };
  return (
    <div className={`border-b border-[#094c60]/10 px-4 py-3 last:border-b-0 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="size-4 shrink-0 opacity-70" />
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-65">
            {label}
          </p>
        </div>
        <p className="text-xs font-semibold opacity-65">{detail}</p>
      </div>
      <p className="weather-data mt-2 text-2xl leading-none">{value}</p>
    </div>
  );
}

const liveOceanCameras: Array<LiveCameraCardProps & { id: string }> = [
  {
    id: "kahului-harbor-cam",
    title: "Harbor camera",
    location: "Kahului Harbor",
    status: "live",
    timestamp: "",
    visualRead: "Harbor check supports the finish read.",
    tone: "harbor",
  },
  {
    id: "north-shore-cam",
    title: "Reef line camera",
    location: "North Shore",
    status: "live",
    timestamp: "",
    visualRead: "Look for whitecaps outside the reef.",
    tone: "north",
  },
  {
    id: "kihei-south-cam",
    title: "South side camera",
    location: "Kihei / South Side",
    status: "live",
    timestamp: "",
    visualRead: "Useful for rain bands and leeward texture.",
    tone: "south",
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
            Camera awareness for surface texture, rain bands, harbor cleanliness, and the Ocean Read.
          </p>
        </div>
        <StatusPill status="Visual checks" live />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
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
          detail="Maui to Molokai water"
          wind={pailoloWind}
          source={getChannelSource("Pailolo Channel", snapshot)}
        />
        <ChannelWindCard
          name="Ka'iwi Channel"
          detail="Oahu to Molokai water"
          wind={kaiwiWind}
          source={getChannelSource("Kaiwi Channel", snapshot)}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#5f7078]">
        Channel cards are prepared for dedicated NOAA marine zone / station mapping.
        NOAA CWF zones: PHZ120 Pailolo Channel and PHZ116 Kaiwi Channel.
      </p>
    </section>
  );
}

function ChannelWindCard({
  name,
  detail,
  wind,
  source,
}: {
  name: string;
  detail: string;
  wind: WindDisplay;
  source: SourceLike;
}) {
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  return (
    <article className={`rounded-2xl border p-5 ${classes.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold leading-tight text-[#102b3a]">{name}</p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.1em] ${classes.muted}`}>
            {detail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Ship className={`size-5 ${classes.text}`} />
          <SourceFreshnessBadge source={source} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
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
    </article>
  );
}

function HarborWindsSection({ harbors }: { harbors: HarborWindObservation[] }) {
  return (
    <section>
      <SectionKicker title="Harbor wind by launch" />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {harbors.map((harbor) => (
          <HarborWindCard key={harbor.id} harbor={harbor} />
        ))}
      </div>
    </section>
  );
}

function HarborWindCard({ harbor }: { harbor: HarborWindObservation }) {
  const wind = windObservationToDisplay(harbor.observation);
  const tone = getWindToneFromText(wind.speed, wind.gust);
  const classes = getWindToneClasses(tone);
  return (
    <article className={`rounded-2xl border p-4 ${classes.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold leading-tight text-[#102b3a]">{harbor.name}</p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.1em] ${classes.muted}`}>{harbor.side} side</p>
        </div>
        <SourceFreshnessBadge source={harbor.observation.source} />
      </div>
      <div className="mt-4 flex items-start gap-3">
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
      <p className="mt-3 text-sm leading-6 text-[#536b73]">{harbor.note}</p>
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
    <div className={`rounded-[1.35rem] border p-5 shadow-[0_16px_38px_rgba(8,74,92,0.08)] ${classes.card}`}>
      <div className="flex items-start justify-between gap-3">
        <CategoryPill label="Wind" tone="wind" />
        <SourceFreshnessBadge source={snapshot.wind.source} />
      </div>
      <div className="mt-5 flex items-center gap-4">
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

function LiveSeaInlineCard({
  swell,
  snapshot,
}: {
  swell: ReturnType<typeof parseSwell>;
  snapshot: OceanConditionSnapshot;
}) {
  return (
    <section className="rounded-[1.35rem] border border-blue-800/10 bg-blue-50/45 p-5 shadow-[0_16px_38px_rgba(8,74,92,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 pt-1">
          <Waves className="size-5 text-blue-700" />
          <CategoryPill label="Sea / bumps" tone="swell" />
        </div>
        <SourceFreshnessBadge source={snapshot.swell.source} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <MiniStat label="Size" value={swell.height} tone="swell" featured />
        <MiniStat label="Period" value={swell.period} tone="swell" featured />
        <MiniStat label="Dir" value={swell.direction} tone="swell" featured />
      </div>
      <p className="mt-4 text-sm leading-6 text-blue-900/75">
        Open-ocean sea texture / bumps, not shorebreak size.
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
    <section className="ocean-card rounded-[1.5rem] border border-indigo-800/10 bg-indigo-50/45 p-5">
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
    <section className="ocean-card rounded-[1.5rem] border border-teal-800/10 bg-teal-50/45 p-5">
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

type WindowCall = "Solid" | "Mixed" | "Heavy";

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
  const station = source.stationId ?? getCompactSourceName(source.source);
  return (
    <span className="inline-flex w-fit max-w-full items-center gap-2 justify-self-start rounded-full border border-[#d7e0e3] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f7078]">
      <span className={`size-2 rounded-full ${source.status === "live" ? "live-pulse bg-emerald-500" : source.status === "mock" ? "bg-amber-500" : "bg-slate-400"}`} />
      <span className="truncate">
        {station} · {freshness}
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

function CategoryPill({
  label,
  tone,
}: {
  label: string;
  tone: "wind" | "gust" | "swell" | "tide" | "rain" | "alert";
}) {
  const classes = {
    wind: "border-cyan-700/15 bg-cyan-50 text-cyan-800",
    gust: "border-amber-700/15 bg-amber-50 text-amber-800",
    swell: "border-blue-700/15 bg-blue-50 text-blue-800",
    tide: "border-indigo-700/15 bg-indigo-50 text-indigo-800",
    rain: "border-teal-700/15 bg-teal-50 text-teal-800",
    alert: "border-orange-700/20 bg-orange-50 text-orange-800",
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
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e0e3] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#4f626a]">
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
  channel: "kaiwi",
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

  return fallback;
}

function getChannelSource(channel: "Pailolo Channel" | "Kaiwi Channel", snapshot: OceanConditionSnapshot): SourceLike {
  const zone = channel === "Pailolo Channel" ? "PHZ120" : "PHZ116";
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

function formatSwell(snapshot: OceanConditionSnapshot) {
  if (snapshot.swell.heightFt === null) return "Swell not available";
  return `${snapshot.swell.heightFt} ft @ ${snapshot.swell.dominantPeriodSec ?? "-"}s ${snapshot.swell.directionCardinal ?? ""}`;
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
      card: "border-emerald-800/10 bg-emerald-50/55 text-emerald-950",
      text: "text-emerald-950",
      muted: "text-emerald-900/65",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800",
    },
    clean: {
      card: "border-cyan-800/10 bg-cyan-50/60 text-cyan-950",
      text: "text-cyan-950",
      muted: "text-cyan-900/65",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-cyan-700/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-800",
    },
    medium: {
      card: "border-amber-800/12 bg-amber-50/65 text-amber-950",
      text: "text-amber-950",
      muted: "text-amber-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-amber-700/18 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900",
    },
    strong: {
      card: "border-red-900/15 bg-red-50/70 text-red-950",
      text: "text-red-950",
      muted: "text-red-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-red-800/20 bg-red-100/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-red-950",
    },
    wild: {
      card: "border-violet-900/15 bg-violet-50/70 text-violet-950",
      text: "text-violet-950",
      muted: "text-violet-900/70",
      badge:
        "inline-flex items-center gap-2 rounded-full border border-violet-800/20 bg-violet-100/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-violet-950",
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

function classifyWindow(
  windSpeed: number | null,
  gust: number | null,
  rain: number | null,
): WindowCall {
  if (windSpeed === null) return "Mixed";
  if (
    windSpeed >= 18 &&
    windSpeed <= 28 &&
    (gust ?? 0) <= 35 &&
    (rain ?? 0) < 40
  )
    return "Solid";
  if (windSpeed < 10 || windSpeed > 32 || (rain ?? 0) >= 55) return "Heavy";
  return "Mixed";
}

function getReadClass(read: WindowCall) {
  if (read === "Solid")
    return "rounded-xl border border-teal-800/10 bg-teal-50/80 px-3 py-2 text-teal-950";
  if (read === "Mixed")
    return "rounded-xl border border-amber-800/10 bg-amber-50/80 px-3 py-2 text-amber-950";
  return "rounded-xl border border-orange-800/15 bg-orange-50/85 px-3 py-2 text-orange-950";
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
          ? "rounded-full border border-[#b9c9ce] bg-white/80 px-4 py-2 text-sm font-semibold text-[#102b3a] shadow-[0_8px_20px_rgba(7,35,45,0.06)]"
          : "rounded-full border border-[#d7e0e3] bg-white/45 px-4 py-2 text-sm font-semibold text-[#526a73] transition hover:border-[#b9c9ce] hover:bg-white/75 hover:text-[#102b3a]"
      }
    >
      {getZoneLabel(zone)}
    </Link>
  );
}

function getZoneLabel(zone: Zone) {
  return zone === "windward" ? "Windward" : "Leeward";
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

export { normalizeZone };

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
