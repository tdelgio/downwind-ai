import type { SourceTimestamp, TideEvent } from "@/lib/types";

export const kahuluiTideStationId = "1615680";
export const noaaTidesApiUrl = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export async function fetchKahuluiTidePredictions() {
  const params = new URLSearchParams({
    product: "predictions",
    application: "maui_ocean_report",
    begin_date: "today",
    range: "48",
    datum: "MLLW",
    station: kahuluiTideStationId,
    time_zone: "lst_ldt",
    units: "english",
    interval: "hilo",
    format: "json",
  });

  const response = await fetch(`${noaaTidesApiUrl}?${params}`, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`NOAA tide predictions failed: ${response.status}`);
  }

  return response.json();
}

export function parseKahuluiTidePredictions(): TideEvent[] {
  // TODO: Normalize NOAA CO-OPS predictions into TideEvent records.
  return [];
}

export const noaaTidesSourceTimestamp: SourceTimestamp = {
  source: "NOAA CO-OPS Kahului tide predictions",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Kahului station 1615680 is wired; parser is TODO.",
};
