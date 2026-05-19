import type { MarineForecast, MarineWarning, SourceTimestamp } from "@/lib/types";

const NWS_BASE_URL = "https://api.weather.gov";

export interface NwsPointResponse {
  properties?: {
    forecastHourly?: string;
    gridId?: string;
    gridX?: number;
    gridY?: number;
  };
}

export async function fetchNwsPoint(latitude: number, longitude: number) {
  const response = await fetch(`${NWS_BASE_URL}/points/${latitude},${longitude}`, {
    headers: { Accept: "application/geo+json" },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`NWS point lookup failed: ${response.status}`);
  }

  return (await response.json()) as NwsPointResponse;
}

export async function fetchNwsHourlyForecast(latitude: number, longitude: number) {
  const point = await fetchNwsPoint(latitude, longitude);
  const forecastHourly = point.properties?.forecastHourly;

  if (!forecastHourly) {
    throw new Error("NWS point response did not include an hourly forecast URL.");
  }

  const response = await fetch(forecastHourly, {
    headers: { Accept: "application/geo+json" },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`NWS hourly forecast failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchNwsAlerts() {
  const response = await fetch(`${NWS_BASE_URL}/alerts/active?area=HI`, {
    headers: { Accept: "application/geo+json" },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`NWS alerts failed: ${response.status}`);
  }

  return response.json();
}

export function parseNwsHourlyToMarineForecasts(): MarineForecast[] {
  // TODO: Normalize NWS hourly periods into MarineForecast entries by Maui zone.
  return [];
}

export function parseNwsAlertsToWarnings(): MarineWarning[] {
  // TODO: Filter active NWS alerts to Maui marine zones and normalize severity.
  return [];
}

export const nwsSourceTimestamp: SourceTimestamp = {
  source: "NWS API",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "/points and hourly forecast functions are ready; parser stubbed for Maui marine normalization.",
};
