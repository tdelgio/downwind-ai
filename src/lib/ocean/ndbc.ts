import { mockSwellObservation, mockWindObservation } from "./mock-data";
import type { SourceMeta, SwellObservation, WindObservation } from "./types";

const NDBC_REALTIME_BASE_URL = "https://www.ndbc.noaa.gov/data/realtime2";

interface NdbcParsedRow {
  observedAt: string;
  windDirectionDeg: number | null;
  windSpeedKt: number | null;
  gustKt: number | null;
  waveHeightFt: number | null;
  dominantPeriodSec: number | null;
  meanWaveDirectionDeg: number | null;
  waterTempF: number | null;
}

export async function fetchNdbcRealtimeText(stationId: string): Promise<string> {
  const response = await fetch(`${NDBC_REALTIME_BASE_URL}/${stationId}.txt`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`NDBC ${stationId} request failed with ${response.status}`);
  }

  return response.text();
}

export async function getNdbcObservations(stationId: string): Promise<{ wind: WindObservation; swell: SwellObservation }> {
  try {
    const text = await fetchNdbcRealtimeText(stationId);
    const row = parseLatestNdbcRow(text);
    const fetchedAt = new Date().toISOString();
    const source = createSource("NDBC realtime", "live", stationId, fetchedAt, row?.observedAt);

    if (!row) {
      throw new Error(`NDBC ${stationId} had no parseable realtime rows`);
    }

    return {
      wind: {
        speedKt: row.windSpeedKt,
        gustKt: row.gustKt,
        directionDeg: row.windDirectionDeg,
        directionCardinal: degreesToCardinal(row.windDirectionDeg),
        source,
      },
      swell: {
        heightFt: row.waveHeightFt,
        dominantPeriodSec: row.dominantPeriodSec,
        directionDeg: row.meanWaveDirectionDeg,
        directionCardinal: degreesToCardinal(row.meanWaveDirectionDeg),
        waterTempF: row.waterTempF,
        source,
      },
    };
  } catch (error) {
    return {
      wind: withError(mockWindObservation, stationId, error),
      swell: withError(mockSwellObservation, stationId, error),
    };
  }
}

export function parseLatestNdbcRow(text: string): NdbcParsedRow | null {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/));

  const latest = rows[0];
  if (!latest || latest.length < 9) return null;

  const [year, month, day, hour, minute, wdir, wspd, gst, wvht, dpd] = latest;
  const mwd = latest[11];
  const wtmp = latest[14];

  return {
    observedAt: `${year}-${month}-${day}T${hour}:${minute}:00Z`,
    windDirectionDeg: numberOrNull(wdir),
    windSpeedKt: metersPerSecondToKnots(numberOrNull(wspd)),
    gustKt: metersPerSecondToKnots(numberOrNull(gst)),
    waveHeightFt: metersToFeet(numberOrNull(wvht)),
    dominantPeriodSec: numberOrNull(dpd),
    meanWaveDirectionDeg: numberOrNull(mwd),
    waterTempF: celsiusToFahrenheit(numberOrNull(wtmp)),
  };
}

export function degreesToCardinal(degrees: number | null): string | null {
  if (degrees === null) return null;
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(degrees / 22.5) % 16];
}

function createSource(source: string, status: SourceMeta["status"], stationId: string, fetchedAt: string, observedAt?: string): SourceMeta {
  return {
    source,
    status,
    stationId,
    fetchedAt,
    observedAt,
    freshnessMinutes: observedAt ? minutesBetween(observedAt, fetchedAt) : undefined,
  };
}

function withError<T extends WindObservation | SwellObservation>(observation: T, stationId: string, error: unknown): T {
  return {
    ...observation,
    source: {
      ...observation.source,
      stationId,
      status: "mock",
      error: error instanceof Error ? error.message : "Unknown NDBC error",
    },
  };
}

function numberOrNull(value: string | undefined): number | null {
  if (!value || value === "MM") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metersPerSecondToKnots(value: number | null): number | null {
  return value === null ? null : round(value * 1.94384, 1);
}

function metersToFeet(value: number | null): number | null {
  return value === null ? null : round(value * 3.28084, 1);
}

function celsiusToFahrenheit(value: number | null): number | null {
  return value === null ? null : round((value * 9) / 5 + 32, 1);
}

function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function round(value: number, places: number): number {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
}
