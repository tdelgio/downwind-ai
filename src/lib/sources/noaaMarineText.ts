import type { MarineForecast, SourceTimestamp } from "@/lib/types";

export const coastalWatersForecastUrl =
  "https://forecast.weather.gov/product.php?issuedby=HFO&product=CWF&site=hfo";

export const marineForecastMatrixUrl = "https://www.weather.gov/hfo/MFM";

export async function fetchCoastalWatersForecastText() {
  const response = await fetch(coastalWatersForecastUrl, { next: { revalidate: 900 } });

  if (!response.ok) {
    throw new Error(`NOAA CWF fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function fetchMarineForecastMatrix() {
  const response = await fetch(marineForecastMatrixUrl, { next: { revalidate: 900 } });

  if (!response.ok) {
    throw new Error(`NOAA MFM fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parseCoastalWatersForecast(): MarineForecast[] {
  // TODO: Parse HFO coastal waters forecast sections for PHZ117/PHZ118/PHZ119.
  return [];
}

export function parseMarineForecastMatrix(): Partial<MarineForecast>[] {
  // TODO: Extract matrix wind, seas, swell period, and weather rows.
  return [];
}

export const noaaMarineTextSourceTimestamp: SourceTimestamp = {
  source: "NOAA HFO Coastal Waters Forecast + Marine Forecast Matrix",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Fetch helpers are in place; text and matrix parsers are TODO.",
};
