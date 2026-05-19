import type { SourceTimestamp, SurfForecast } from "@/lib/types";

export const hawaiiWeatherTodaySurfUrl = "https://www.hawaiiweathertoday.com/surfing/";

export async function fetchHawaiiWeatherTodaySurf() {
  const response = await fetch(hawaiiWeatherTodaySurfUrl, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error(`Hawaii Weather Today surf fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parseHawaiiWeatherTodayMauiSurf(): SurfForecast[] {
  // TODO: Parse narrative swell direction and Maui Beaches spot sizes from Hawaii Weather Today.
  // Current page includes Maui spots like Hana, Hookipa, Kanaha, Kihei/Wailea, Maalaea Bay, Lahaina, and Upper West.
  return [];
}

export const hawaiiWeatherTodaySourceTimestamp: SourceTimestamp = {
  source: "Hawaii Weather Today Maui surf",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Surf page is wired for Maui spot sizes and swell direction narrative; parser is TODO.",
};
