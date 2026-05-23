import { mockCurrentObservation, mockTideObservation } from "./mock-data";
import type { CurrentObservation, SourceMeta, TideEvent, TideObservation, TideTrend } from "./types";

const COOPS_API_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const COOPS_METADATA_URL = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations";

interface CoopsPrediction {
  t: string;
  v: string;
  type?: "H" | "L";
}

interface CoopsWaterLevel {
  t: string;
  v: string;
}

interface CoopsCurrent {
  t: string;
  s?: string;
  d?: string;
  bin?: string;
}

export async function getCoopsTideObservation(stationId: string): Promise<TideObservation> {
  try {
    const [metadata, predictions, waterLevels] = await Promise.all([
      fetchStationMetadata(stationId),
      fetchTidePredictions(stationId),
      fetchCurrentWaterLevels(stationId),
    ]);
    const fetchedAt = new Date().toISOString();
    const source: SourceMeta = {
      source: "NOAA CO-OPS",
      status: "live",
      stationId,
      fetchedAt,
      observedAt: waterLevels.at(-1)?.t,
      freshnessMinutes: waterLevels.at(-1)?.t ? minutesBetween(waterLevels.at(-1)!.t, fetchedAt) : undefined,
    };
    const events = predictions.map(parsePrediction).filter((event): event is TideEvent => Boolean(event));
    const currentWaterLevelFt = waterLevels.at(-1)?.v ? Number(waterLevels.at(-1)!.v) : null;

    return {
      stationId,
      stationName: metadata?.name ?? stationId,
      currentWaterLevelFt: Number.isFinite(currentWaterLevelFt) ? currentWaterLevelFt : null,
      trend: inferTideTrend(waterLevels),
      nextHigh: findNextEvent(events, "high"),
      nextLow: findNextEvent(events, "low"),
      predictions: events,
      source,
    };
  } catch (error) {
    return {
      ...mockTideObservation,
      stationId,
      source: {
        ...mockTideObservation.source,
        stationId,
        status: "mock",
        error: error instanceof Error ? error.message : "Unknown CO-OPS error",
      },
    };
  }
}

export async function getCoopsCurrentObservation(stationId?: string): Promise<CurrentObservation> {
  if (!stationId) return mockCurrentObservation;

  try {
    const [metadata, currents] = await Promise.all([
      fetchStationMetadata(stationId),
      fetchCurrentVelocity(stationId),
    ]);
    const latest = currents.at(-1);
    const fetchedAt = new Date().toISOString();
    const speedKt = latest?.s ? Number(latest.s) : null;
    const directionDeg = latest?.d ? Number(latest.d) : null;
    const source: SourceMeta = {
      source: "NOAA CO-OPS currents",
      status: "live",
      stationId,
      fetchedAt,
      observedAt: latest?.t,
      freshnessMinutes: latest?.t ? minutesBetween(latest.t, fetchedAt) : undefined,
    };

    return {
      stationId,
      stationName: metadata?.name ?? stationId,
      speedKt: Number.isFinite(speedKt) ? speedKt : null,
      directionDeg: Number.isFinite(directionDeg) ? directionDeg : null,
      directionCardinal: Number.isFinite(directionDeg) ? degreesToCardinal(directionDeg!) : null,
      trend: inferCurrentTrend(speedKt, directionDeg),
      source,
    };
  } catch (error) {
    return {
      ...mockCurrentObservation,
      stationId,
      source: {
        ...mockCurrentObservation.source,
        stationId,
        status: "mock",
        error: error instanceof Error ? error.message : "Unknown CO-OPS currents error",
      },
    };
  }
}

async function fetchCurrentVelocity(stationId: string): Promise<CoopsCurrent[]> {
  const params = new URLSearchParams({
    product: "currents",
    application: "downwind_ai",
    date: "latest",
    station: stationId,
    time_zone: "lst_ldt",
    units: "english",
    format: "json",
  });
  const response = await fetch(`${COOPS_API_URL}?${params}`, { next: { revalidate: 600 } });
  if (!response.ok) throw new Error(`CO-OPS currents failed with ${response.status}`);
  const json = (await response.json()) as { data?: CoopsCurrent[] };
  return json.data ?? [];
}

async function fetchTidePredictions(stationId: string): Promise<CoopsPrediction[]> {
  const params = new URLSearchParams({
    product: "predictions",
    application: "downwind_ai",
    begin_date: "today",
    range: "72",
    datum: "MLLW",
    station: stationId,
    time_zone: "lst_ldt",
    units: "english",
    interval: "hilo",
    format: "json",
  });
  const response = await fetch(`${COOPS_API_URL}?${params}`, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error(`CO-OPS tide predictions failed with ${response.status}`);
  const json = (await response.json()) as { predictions?: CoopsPrediction[] };
  return json.predictions ?? [];
}

async function fetchCurrentWaterLevels(stationId: string): Promise<CoopsWaterLevel[]> {
  const params = new URLSearchParams({
    product: "water_level",
    application: "downwind_ai",
    date: "latest",
    datum: "MLLW",
    station: stationId,
    time_zone: "lst_ldt",
    units: "english",
    format: "json",
  });
  const response = await fetch(`${COOPS_API_URL}?${params}`, { next: { revalidate: 600 } });
  if (!response.ok) throw new Error(`CO-OPS water level failed with ${response.status}`);
  const json = (await response.json()) as { data?: CoopsWaterLevel[] };
  return json.data ?? [];
}

async function fetchStationMetadata(stationId: string): Promise<{ name?: string } | null> {
  const response = await fetch(`${COOPS_METADATA_URL}/${stationId}.json`, { next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const json = (await response.json()) as { stations?: Array<{ name?: string }> };
  return json.stations?.[0] ?? null;
}

function parsePrediction(prediction: CoopsPrediction): TideEvent | null {
  const heightFt = Number(prediction.v);
  if (!Number.isFinite(heightFt) || !prediction.type) return null;
  return {
    time: prediction.t,
    heightFt,
    type: prediction.type === "H" ? "high" : "low",
  };
}

function findNextEvent(events: TideEvent[], type: TideEvent["type"]): TideEvent | null {
  const now = Date.now();
  return events.find((event) => event.type === type && new Date(event.time).getTime() >= now) ?? null;
}

function inferTideTrend(levels: CoopsWaterLevel[]): TideTrend {
  if (levels.length < 2) return "unknown";
  const latest = Number(levels.at(-1)?.v);
  const previous = Number(levels.at(-2)?.v);
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) return "unknown";
  const delta = latest - previous;
  if (Math.abs(delta) < 0.02) return "slack";
  return delta > 0 ? "rising" : "falling";
}

function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function inferCurrentTrend(speedKt: number | null, directionDeg: number | null): CurrentObservation["trend"] {
  if (speedKt === null || !Number.isFinite(speedKt) || speedKt < 0.2) return "slack";
  if (directionDeg === null || !Number.isFinite(directionDeg)) return "unknown";
  return directionDeg >= 90 && directionDeg <= 270 ? "flood" : "ebb";
}

function degreesToCardinal(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}
