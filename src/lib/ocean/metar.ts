import { degreesToCardinal } from "./ndbc";
import type { WindObservation } from "./types";

const AVIATION_WEATHER_METAR_URL = "https://aviationweather.gov/api/data/metar";
const METAR_FETCH_TIMEOUT_MS = 3500;

type AviationWeatherMetar = {
  rawOb?: string;
  raw_text?: string;
  receiptTime?: string;
  obsTime?: number;
};

export async function getMetarWindObservation(stationId: string, label: string): Promise<WindObservation> {
  try {
    const response = await fetch(`${AVIATION_WEATHER_METAR_URL}?ids=${stationId}&format=json`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(METAR_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`METAR ${stationId} failed with ${response.status}`);

    const payload = (await response.json()) as AviationWeatherMetar[];
    const metar = payload[0];
    const raw = metar?.rawOb ?? metar?.raw_text;
    if (!raw) throw new Error(`METAR ${stationId} missing raw observation`);

    const parsed = parseMetarWind(raw);
    if (!parsed) throw new Error(`METAR ${stationId} missing parseable wind`);

    const fetchedAt = new Date().toISOString();
    const observedAt = metar.obsTime ? new Date(metar.obsTime * 1000).toISOString() : undefined;
    return {
      speedKt: parsed.speedKt,
      gustKt: parsed.gustKt,
      directionDeg: parsed.directionDeg,
      directionCardinal: degreesToCardinal(parsed.directionDeg),
      source: {
        source: `PHOG METAR · ${label}`,
        status: "live",
        stationId,
        sourceUrl: `https://aviationweather.gov/data/metar/?id=${stationId}`,
        fetchedAt,
        observedAt,
        freshnessMinutes: observedAt ? minutesBetween(observedAt, fetchedAt) : undefined,
      },
    };
  } catch (error) {
    return {
      speedKt: null,
      gustKt: null,
      directionDeg: null,
      directionCardinal: null,
      source: {
        source: `PHOG METAR · ${label}`,
        status: "missing",
        stationId,
        sourceUrl: `https://aviationweather.gov/data/metar/?id=${stationId}`,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown METAR wind error",
      },
    };
  }
}

function parseMetarWind(raw: string) {
  const match = raw.match(/\b(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT\b/);
  if (!match) return null;
  const [, direction, speed, gust] = match;
  return {
    directionDeg: direction === "VRB" ? null : Number(direction),
    speedKt: Number(speed),
    gustKt: gust ? Number(gust) : null,
  };
}

function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}
