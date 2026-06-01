import type { MarineForecastDay, MarineForecastEnergy, SourceMeta } from "./types";

const CWF_URL =
  "https://forecast.weather.gov/product.php?site=HFO&issuedby=HFO&product=CWF&format=txt&version=1&glossary=0";
const CWF_FETCH_TIMEOUT_MS = 4500;

const ZONES = {
  windward: "PHZ117",
  leeward: "PHZ118",
} as const;

type MarineZone = keyof typeof ZONES;

export async function getMauiMarineForecastDays(): Promise<
  Record<MarineZone, MarineForecastDay[]>
> {
  try {
    const response = await fetch(CWF_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(CWF_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`NWS CWF failed with ${response.status}`);

    const fetchedAt = new Date().toISOString();
    const text = htmlToText(await response.text());
    const issuedAt = parseIssuedAt(text);
    const source: SourceMeta = {
      source: "NWS Honolulu Coastal Waters Forecast",
      status: "live",
      sourceUrl: CWF_URL,
      fetchedAt,
      observedAt: issuedAt ?? undefined,
    };

    return {
      windward: parseZone(text, ZONES.windward, source),
      leeward: parseZone(text, ZONES.leeward, source),
    };
  } catch {
    return { windward: [], leeward: [] };
  }
}

function parseZone(text: string, zoneId: string, source: SourceMeta): MarineForecastDay[] {
  const section = text.match(new RegExp(`${zoneId}-[\\s\\S]*?\\n\\s*\\$\\$`))?.[0];
  if (!section) return [];

  return section
    .split(/\n\s*\.(?=[A-Z][A-Z ]+\.\.\.)/)
    .map((entry) => entry.match(/^([A-Z ]+)\.\.\.([\s\S]*)/)?.slice(1))
    .filter((entry): entry is [string, string] => Boolean(entry))
    .filter(([label]) => !label.includes("NIGHT"))
    .slice(0, 5)
    .map(([dayLabel, body]) => {
      const waveComponents = parseWaveComponents(body);
      return {
        dayLabel: dayLabel.trim(),
        seas: body.match(/Seas\s+([^.]*)\./i)?.[1]?.trim() ?? null,
        bumpEnergy: strongestEnergy(waveComponents.filter((wave) => wave.periodSec >= 4 && wave.periodSec <= 9)),
        groundswell: strongestEnergy(waveComponents.filter((wave) => wave.periodSec >= 10)),
        rainSummary: parseRainSummary(body),
        source,
      };
    });
}

function parseWaveComponents(body: string): Array<MarineForecastEnergy & { heightFt: number; periodSec: number }> {
  const detail = body.match(/Wave\s+Detail:\s*([\s\S]*)/i)?.[1] ?? "";
  return [...detail.matchAll(/([a-z]+(?:\s+[a-z]+)?)\s+(\d+(?:\.\d+)?)\s+feet?\s+at\s+(\d+)\s+seconds?/gi)]
    .map((match) => ({
      directionCardinal: normalizeDirection(match[1]),
      heightFt: Number.parseFloat(match[2]),
      periodSec: Number.parseInt(match[3], 10),
    }))
    .filter((wave) => Number.isFinite(wave.heightFt) && Number.isFinite(wave.periodSec));
}

function strongestEnergy(components: Array<MarineForecastEnergy & { heightFt: number; periodSec: number }>): MarineForecastEnergy {
  return (
    [...components].sort((a, b) => b.heightFt - a.heightFt || b.periodSec - a.periodSec)[0] ?? {
      heightFt: null,
      periodSec: null,
      directionCardinal: null,
    }
  );
}

function parseRainSummary(body: string) {
  return body.match(/((?:Scattered|Isolated|Numerous|Occasional)[^.]*showers?[^.]*)/i)?.[1]?.trim() ?? null;
}

function normalizeDirection(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ").replace(/^and\s+/, "");
  const directions: Record<string, string> = {
    north: "N",
    "north northeast": "NNE",
    northeast: "NE",
    "east northeast": "ENE",
    east: "E",
    "east southeast": "ESE",
    southeast: "SE",
    "south southeast": "SSE",
    south: "S",
    "south southwest": "SSW",
    southwest: "SW",
    "west southwest": "WSW",
    west: "W",
    "west northwest": "WNW",
    northwest: "NW",
    "north northwest": "NNW",
  };
  return directions[normalized] ?? value.trim().toUpperCase();
}

function parseIssuedAt(text: string) {
  const match = text.match(/(\d{1,2}:\d{2}|\d{3,4})\s+(AM|PM)\s+HST\s+\w+\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{4})/i);
  if (!match) return null;
  const rawTime = match[1].includes(":")
    ? match[1]
    : `${match[1].slice(0, -2) || "0"}:${match[1].slice(-2)}`;
  return new Date(`${match[3]} ${match[4]}, ${match[5]} ${rawTime} ${match[2]} GMT-1000`).toISOString();
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:pre|p|div|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
