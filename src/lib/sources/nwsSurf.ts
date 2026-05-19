import type { SourceTimestamp, SurfForecast } from "@/lib/types";

export const nwsSurfForecastUrl = "https://forecast.weather.gov/product.php?issuedby=HFO&product=SRF&site=HFO";

export async function fetchNwsSurfForecast() {
  const response = await fetch(nwsSurfForecastUrl, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error(`NWS surf forecast failed: ${response.status}`);
  }

  return response.text();
}

export function parseNwsSurfForecast(): SurfForecast[] {
  // TODO: Parse the Maui section of SRFHFO into north/west/south/east shore surf ranges.
  return [];
}

export const nwsSurfSourceTimestamp: SourceTimestamp = {
  source: "NWS Honolulu Surf Zone Forecast",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "SRFHFO source is wired; Maui parser is TODO.",
};
