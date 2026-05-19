import type { SourceTimestamp } from "@/lib/types";

export const pacioosCurrentsUrl = "https://www.pacioos.hawaii.edu/currents/model-hawaii/";

export interface PacioosCurrentSnapshot {
  zone: string;
  direction: string;
  speedKt?: number;
  summary: string;
}

export async function fetchPacioosCurrentsPage() {
  const response = await fetch(pacioosCurrentsUrl, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error(`PacIOOS currents fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parsePacioosCurrents(): PacioosCurrentSnapshot[] {
  // TODO: Replace with PacIOOS data endpoint or model image metadata if available.
  return [
    {
      zone: "Maui County",
      direction: "variable",
      summary: "Current model parser pending; use local knowledge and visible water texture until live layer is added.",
    },
  ];
}

export const pacioosSourceTimestamp: SourceTimestamp = {
  source: "PacIOOS Hawaii currents",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Current model page is referenced; normalized parser is TODO.",
};
