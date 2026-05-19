import type { SourceTimestamp } from "@/lib/types";

export const windytronHomeUrl = "https://windytron.com";
export const windytronWindGraphsUrl = "https://windytron.com/kh_delta.html";
export const windytronNorthSwellUrl = "https://windytron.com/north_swell.html";

export interface WindytronSpotSignal {
  spot: "Kanaha" | "Ho'okipa" | "Kihei";
  signal: string;
  units: "mph";
  notes: string;
}

export async function fetchWindytronHome() {
  const response = await fetch(windytronHomeUrl, { next: { revalidate: 600 } });

  if (!response.ok) {
    throw new Error(`Windytron fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function fetchWindytronWindGraphs() {
  const response = await fetch(windytronWindGraphsUrl, { next: { revalidate: 600 } });

  if (!response.ok) {
    throw new Error(`Windytron wind graphs fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parseWindytronSignals(): WindytronSpotSignal[] {
  // TODO: Parse the local Kanaha, Ho'okipa, and Kihei graph/image outputs.
  return [];
}

export const windytronSourceTimestamp: SourceTimestamp = {
  source: "Windytron Maui wind/swell graphs",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Windytron is wired for Maui north/south wind delta and swell graph references; parser is TODO.",
};
