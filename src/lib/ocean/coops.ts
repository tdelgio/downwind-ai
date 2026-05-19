import { mockTideObservation } from "./mock-data";
import type { SourceMeta, TideEvent, TideObservation, TideTrend } from "./types";

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
