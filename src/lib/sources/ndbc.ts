import type { BuoyObservation, SourceTimestamp } from "@/lib/types";

export const hawaiiBuoyStations = {
  "51205": {
    stationId: "51205",
    name: "Pauwela, Maui North Shore",
    latitude: 21.018,
    longitude: -156.426,
  },
  KLIH1: {
    stationId: "KLIH1",
    name: "Kahului, Kahului Harbor, HI",
    latitude: 20.895,
    longitude: -156.469,
  },
  "51004": {
    stationId: "51004",
    name: "Southeast Hawaii offshore buoy",
    latitude: 17.504,
    longitude: -152.197,
  },
  "51WH0": {
    stationId: "51WH0",
    name: "WHOTS offshore buoy",
    latitude: 22,
    longitude: -157,
  },
  "51213": {
    stationId: "51213",
    name: "Kaumalapau Southwest, Lanai, HI",
    latitude: 20.75,
    longitude: -157.002,
  },
} as const;

export async function fetchNdbcLatestObservation(stationId: string) {
  const response = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`NDBC ${stationId} fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parseNdbcRealtimeText(stationId: keyof typeof hawaiiBuoyStations, text: string): BuoyObservation | null {
  const station = hawaiiBuoyStations[stationId];
  const rows = text
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/));

  const latest = rows[0];
  if (!latest) return null;

  const [year, month, day, hour, minute, windDirection, windSpeed, gust, waveHeight, dominantPeriod] = latest;
  const numberOrUndefined = (value?: string) => {
    if (!value || value === "MM") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    ...station,
    observedAt: `${year}-${month}-${day}T${hour}:${minute}:00Z`,
    windDirectionDeg: numberOrUndefined(windDirection),
    windSpeedKt: msToKt(numberOrUndefined(windSpeed)),
    gustKt: msToKt(numberOrUndefined(gust)),
    waveHeightFt: metersToFeet(numberOrUndefined(waveHeight)),
    dominantPeriodSec: numberOrUndefined(dominantPeriod),
    source: "NDBC",
  };
}

function metersToFeet(value?: number) {
  return value === undefined ? undefined : Number((value * 3.28084).toFixed(1));
}

function msToKt(value?: number) {
  return value === undefined ? undefined : Number((value * 1.94384).toFixed(1));
}

export const ndbcSourceTimestamp: SourceTimestamp = {
  source: "NDBC buoy 51205",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Realtime parser handles NDBC rows; dashboard currently uses mock observation.",
};
