import { AlertTriangle } from "lucide-react";

import { SectionTitle } from "@/components/maui-ocean/shell";
import type { BuoyObservation, HarborWindObservation, MarineForecast, MarineWarning, SourceTimestamp, SurfForecast, TideEvent } from "@/lib/types";

export function DataStatus({ available, updatedAt, source }: { available: boolean; updatedAt: string; source: string }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
      <span className={available ? "text-[#0d5f73]" : "text-amber-800"}>{available ? "Data available" : "Data missing"}</span>
      <span className="text-[#667987]">Last updated {formatShortDateTime(updatedAt)}</span>
      <span className="text-[#667987]">Source: {source}</span>
    </div>
  );
}

export function MarineDataBlock({ title, label, forecast }: { title: string; label?: string; forecast: MarineForecast }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        {label ? <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f73]">{label}</p> : null}
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08243a]">{title}</h2>
        <div className="mt-3">
          <DataStatus available updatedAt={forecast.issuedAt} source={forecast.source} />
        </div>
      </div>
      <ExplicitGrid
        items={[
          ["Wind", `${forecast.windSpeedKt} kt`],
          ["Gust", forecast.gustKt ? `${forecast.gustKt} kt` : "Data missing"],
          ["Direction", forecast.windDirection],
          ["Swell", forecast.swellFt ? `${forecast.swellFt} ft` : "Data missing"],
          ["Swell dir", forecast.swellDirection ?? "Data missing"],
          ["Period", forecast.swellPeriodSec ? `${forecast.swellPeriodSec}s` : "Data missing"],
          ["Seas", `${forecast.seasFt} ft`],
          ["Rain", `${forecast.rainChancePercent}%`],
          ["Clouds", forecast.clouds],
        ]}
      />
    </section>
  );
}

export function ObservationBlock({ title, observation }: { title: string; observation: BuoyObservation }) {
  const items: Array<[string, string]> = [
    ["Station", observation.stationId],
    ["Wind", observation.windSpeedKt ? `${observation.windSpeedKt} kt` : "Data missing"],
    ["Gust", observation.gustKt ? `${observation.gustKt} kt` : "Data missing"],
    ["Direction", observation.windDirectionDeg ? `${observation.windDirectionDeg}°` : "Data missing"],
  ];

  if (observation.waveHeightFt !== undefined) {
    items.push(["Swell", `${observation.waveHeightFt} ft`]);
  }

  if (observation.dominantPeriodSec !== undefined) {
    items.push(["Period", `${observation.dominantPeriodSec}s`]);
  }

  items.push(
    ["Water", observation.waterTempF ? `${observation.waterTempF}°F` : "Data missing"],
    ["Pressure", observation.pressureMb ? `${observation.pressureMb} mb` : "Data missing"],
  );

  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-tight text-[#08243a]">{title}</h2>
        <div className="mt-3">
          <DataStatus available={observation.status !== "data missing"} updatedAt={observation.observedAt} source={observation.source} />
        </div>
      </div>
      <ExplicitGrid items={items} />
    </section>
  );
}

export function SurfDataBlock({ surf }: { surf: SurfForecast }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f73]">{surf.shore} shore</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08243a]">{surf.area}</h2>
        <div className="mt-3">
          <DataStatus available updatedAt={surf.issuedAt} source={surf.source} />
        </div>
      </div>
      <ExplicitGrid
        items={[
          ["Surf", surf.today],
          ["Swell height", surf.today],
          ["Swell dir", surf.swellDirection],
          ["Period", surf.swellPeriod ?? "Data missing"],
          ["Wind", surf.wind],
          ["Tomorrow", surf.tomorrow ?? "Data missing"],
          ["Day 3", surf.day3 ?? "Data missing"],
        ]}
      />
    </section>
  );
}

export function ThreeDayMarineBlock({
  title,
  label,
  forecasts,
}: {
  title: string;
  label?: string;
  forecasts: MarineForecast[];
}) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        {label ? <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f73]">{label}</p> : null}
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08243a]">{title}</h2>
        <p className="mt-2 text-sm font-semibold text-[#667987]">3-day forecast. Source and update time shown per day.</p>
      </div>
      <div className="space-y-3">
        {forecasts.map((forecast) => (
          <div key={`${forecast.zoneId}-${forecast.period}`} className="rounded-2xl bg-[#fffaf0] p-4 ring-1 ring-[#d8cdbd]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-[#0d5f73] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  {forecast.period}
                </span>
              </div>
              <DataStatus available updatedAt={forecast.issuedAt} source={forecast.source} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
              <ReadableLine label="Wind" value={`${forecast.windDirection} ${forecast.windSpeedKt} kt${forecast.gustKt ? `, gust ${forecast.gustKt}` : ""}`} />
              <ReadableLine label="Ocean" value={`${forecast.seasFt} ft seas · ${forecast.swellFt ?? "-"} ft ${forecast.swellDirection ?? "swell"} @ ${forecast.swellPeriodSec ?? "-"}s`} />
              <ReadableLine label="Weather" value={`${forecast.rainChancePercent}% rain · ${forecast.clouds} clouds`} />
              <ReadableLine label="Squalls" value={forecast.rainChancePercent >= 40 || forecast.clouds === "mostly" ? "elevated risk" : "lower risk"} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DownwindSimpleBlock({ forecasts }: { forecasts: MarineForecast[] }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f73]">Downwind</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08243a]">North Shore / Maliko Harbor</h2>
        <p className="mt-2 text-sm font-semibold text-[#667987]">
          Simple read based on wind strength, gusts, seas, swell period, rain, and clouds.
        </p>
      </div>
      <div className="space-y-3">
        {forecasts.map((forecast) => (
          <div key={`${forecast.zoneId}-${forecast.period}`} className="rounded-2xl bg-[#fffaf0] p-4 ring-1 ring-[#d8cdbd]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex rounded-full bg-[#0d5f73] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                {forecast.period}
              </span>
              <span className="text-lg font-black text-[#08243a]">{downwindCondition(forecast)}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReadableLine label="Wind" value={`${forecast.windDirection} ${forecast.windSpeedKt} kt${forecast.gustKt ? `, gust ${forecast.gustKt}` : ""}`} />
              <ReadableLine label="Bump" value={`${forecast.seasFt} ft seas · ${forecast.swellFt ?? "-"} ft ${forecast.swellDirection ?? "swell"} @ ${forecast.swellPeriodSec ?? "-"}s`} />
              <ReadableLine label="Rain" value={`${forecast.rainChancePercent}% · ${forecast.clouds} clouds`} />
              <ReadableLine label="Surf" value={`${forecast.swellFt ?? "-"} ft · ${forecast.swellDirection ?? "direction missing"}`} />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#667987]">
              Source: {forecast.source} · {formatShortDateTime(forecast.issuedAt)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DownwindSiteTabs() {
  return (
    <div className="mb-5 flex gap-2">
      <span className="rounded-full bg-[#0d5f73] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">North Shore</span>
      <span className="rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0d5f73] ring-1 ring-[#d8cdbd]">
        South Side / Kihei
      </span>
    </div>
  );
}

export function OffshoreAverageBlock({ buoys }: { buoys: BuoyObservation[] }) {
  const waveValues = buoys.map((buoy) => buoy.waveHeightFt).filter((value): value is number => value !== undefined);
  const windValues = buoys.map((buoy) => buoy.windSpeedKt).filter((value): value is number => value !== undefined);
  const periodValues = buoys.map((buoy) => buoy.dominantPeriodSec).filter((value): value is number => value !== undefined);

  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <SectionTitle kicker="Offshore waters" title="Offshore buoy average" />
      <p className="mt-2 text-sm font-semibold text-[#667987]">
        Averaged from available offshore buoys. Used as broad open-ocean context, not a harbor reading.
      </p>
      <div className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-[#d8cdbd] sm:grid-cols-4">
        <Cell label="Stations" value={buoys.map((buoy) => buoy.stationId).join(" / ")} />
        <Cell label="Avg wind" value={windValues.length ? `${average(windValues).toFixed(1)} kt` : "Missing"} />
        <Cell label="Avg swell" value={waveValues.length ? `${average(waveValues).toFixed(1)} ft` : "Missing"} />
        <Cell label="Avg period" value={periodValues.length ? `${average(periodValues).toFixed(0)}s` : "Missing"} />
      </div>
    </section>
  );
}

export function HarborWindTable({ harbors }: { harbors: HarborWindObservation[] }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <SectionTitle kicker="Harbors" title="Wind at Maui launch harbors" />
      <div className="mt-5 divide-y divide-[#d8cdbd]">
        {harbors.map((harbor) => (
          <div key={harbor.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_0.8fr_0.8fr_1fr]">
            <div>
              <p className="font-black text-[#08243a]">{harbor.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#667987]">{harbor.status}</p>
            </div>
            <p className="text-lg font-black text-[#08243a]">{harbor.windDirection} {harbor.windSpeedKt ?? "-"} kt</p>
            <p className="text-lg font-black text-[#08243a]">Gust {harbor.gustKt ?? "-"} kt</p>
            <p className="text-sm font-semibold text-[#667987]">Rain {harbor.rainChancePercent ?? "-"}% · {harbor.clouds ?? "clouds missing"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SurfExtendedBlock({ surf }: { surf: SurfForecast }) {
  const incoming =
    surf.day3 && surf.today !== surf.day3
      ? `Watch change: ${surf.today} today to ${surf.day3} on Day 3.`
      : "No larger swell signal in this mock data.";

  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f73]">{surf.shore} shore</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08243a]">{surf.area}</h2>
        <div className="mt-3">
          <DataStatus available updatedAt={surf.issuedAt} source={surf.source} />
        </div>
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl bg-[#d8cdbd] sm:grid-cols-3">
        <Cell label="Today" value={surf.today} />
        <Cell label="Tomorrow" value={surf.tomorrow ?? "Missing"} />
        <Cell label="Day 3" value={surf.day3 ?? "Missing"} />
        <Cell label="Swell dir" value={surf.swellDirection} />
        <Cell label="Period" value={surf.swellPeriod ?? "Missing"} />
        <Cell label="Wind" value={surf.wind} />
      </div>
      <p className="mt-4 text-base font-semibold leading-7 text-[#4f6270]">{incoming} {surf.notes}</p>
    </section>
  );
}

export function TideCard({ tides }: { tides: TideEvent[] }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <SectionTitle kicker="Tides" title="Kahului Harbor / 1615680" />
      <div className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-[#d8cdbd] sm:grid-cols-3">
        {tides.map((tide) => (
          <div key={`${tide.type}-${tide.time}`} className="bg-[#fffaf0] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#667987]">{tide.type}</p>
            <p className="mt-2 text-2xl font-black text-[#08243a]">{tide.heightFt.toFixed(1)} ft</p>
            <p className="mt-1 text-sm font-semibold text-[#667987]">{formatShortDateTime(tide.time)}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#667987]">Source: {tide.source}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WarningList({ warnings }: { warnings: MarineWarning[] }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <SectionTitle kicker="Warnings" title={warnings.length ? "Active marine warnings" : "No active marine warnings"} />
      <div className="mt-5 space-y-3">
        {warnings.length ? (
          warnings.map((warning) => (
            <div key={warning.id} className="rounded-2xl bg-[#fff3d6] p-4 ring-1 ring-[#e7c879]">
              <div className="flex items-center gap-2 font-black text-[#6b4a00]">
                <AlertTriangle className="size-4" />
                {warning.title}
              </div>
              <p className="mt-2 text-sm font-semibold text-[#6b4a00]">{warning.summary}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#6b4a00]">Source: {warning.source}</p>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-[#667987]">Data available. No mock warnings active.</p>
        )}
      </div>
    </section>
  );
}

export function SourceList({ sources }: { sources: SourceTimestamp[] }) {
  return (
    <section className="border-t border-[#d8cdbd] py-7">
      <SectionTitle kicker="Sources" title="Data status" />
      <div className="mt-5 divide-y divide-[#d8cdbd]">
        {sources.map((source) => (
          <div key={source.source} className="grid gap-2 py-3 sm:grid-cols-[1fr_0.4fr_0.8fr]">
            <p className="font-black text-[#08243a]">{source.source}</p>
            <p className="text-sm font-bold uppercase text-[#0d5f73]">{source.status}</p>
            <p className="text-sm font-semibold text-[#667987]">{formatShortDateTime(source.updatedAt)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExplicitGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[#d8cdbd] sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="bg-[#fffaf0] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#667987]">{label}</p>
          <p className="mt-2 text-xl font-black leading-tight text-[#08243a]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fffaf0] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#667987]">{label}</p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08243a]">{value}</p>
    </div>
  );
}

function ReadableLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-[#667987]">{label}</p>
      <p className="mt-1 text-lg font-black leading-tight text-[#08243a]">{value}</p>
    </div>
  );
}

function downwindCondition(forecast: MarineForecast) {
  if (forecast.windSpeedKt >= 18 && forecast.windSpeedKt <= 28 && forecast.seasFt >= 4 && forecast.seasFt <= 8 && forecast.rainChancePercent < 45) {
    return "Looks lined up";
  }

  if (forecast.windSpeedKt > 28 || forecast.seasFt > 8 || forecast.rainChancePercent >= 45) {
    return "Rough / advanced";
  }

  return "Marginal";
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}
