import { getNdbcObservations } from "./ndbc";
import { getNwsCurrentWindObservation } from "./nws";
import type { GeoPoint, HarborWindObservation, WindObservation } from "./types";

type HarborWindConfig = {
  id: string;
  name: string;
  side: HarborWindObservation["side"];
  coordinates: GeoPoint;
  stationId?: string;
  source: "ndbc" | "nws";
  note: string;
};

export const mauiHarborWindConfigs: HarborWindConfig[] = [
  {
    id: "kahului-harbor",
    name: "Kahului Harbor",
    side: "central",
    coordinates: { latitude: 20.895, longitude: -156.469 },
    stationId: "KLIH1",
    source: "ndbc",
    note: "NOAA/NOS 1615680 / NDBC KLIH1 inside Kahului Harbor wind.",
  },
  {
    id: "maalaea-harbor",
    name: "Maalaea Harbor",
    side: "south",
    coordinates: { latitude: 20.790, longitude: -156.512 },
    source: "nws",
    note: "NWS hourly point forecast proxy until a harbor station is connected.",
  },
  {
    id: "mala-ramp",
    name: "Mala Ramp",
    side: "west",
    coordinates: { latitude: 20.884, longitude: -156.686 },
    source: "nws",
    note: "NWS hourly point forecast proxy until a harbor station is connected.",
  },
  {
    id: "lahaina-harbor",
    name: "Lahaina Harbor",
    side: "west",
    coordinates: { latitude: 20.872, longitude: -156.678 },
    source: "nws",
    note: "NWS hourly point forecast proxy until a harbor station is connected.",
  },
];

const HARBOR_WIND_CACHE_TTL_MS = 5 * 60 * 1000;
let harborWindCache:
  | {
      expiresAt: number;
      observations: HarborWindObservation[];
    }
  | null = null;
let inFlightHarborWinds: Promise<HarborWindObservation[]> | null = null;

export async function getMauiHarborWinds(): Promise<HarborWindObservation[]> {
  const now = Date.now();
  if (harborWindCache && harborWindCache.expiresAt > now) {
    return harborWindCache.observations;
  }

  if (inFlightHarborWinds) {
    return inFlightHarborWinds;
  }

  inFlightHarborWinds = Promise.all(mauiHarborWindConfigs.map(getHarborWind))
    .then((observations) => {
      harborWindCache = {
        expiresAt: Date.now() + HARBOR_WIND_CACHE_TTL_MS,
        observations,
      };
      return observations;
    })
    .finally(() => {
      inFlightHarborWinds = null;
    });

  return inFlightHarborWinds;
}

async function getHarborWind(config: HarborWindConfig): Promise<HarborWindObservation> {
  const observation = await getHarborWindObservation(config);
  return {
    id: config.id,
    name: config.name,
    side: config.side,
    coordinates: config.coordinates,
    observation,
    note: config.note,
  };
}

async function getHarborWindObservation(config: HarborWindConfig): Promise<WindObservation> {
  if (config.source === "ndbc" && config.stationId) {
    const { wind } = await getNdbcObservations(config.stationId);
    return {
      ...wind,
      source: {
        ...wind.source,
        source: `NDBC real-time · ${config.name}`,
      },
    };
  }

  return getNwsCurrentWindObservation(config.coordinates, config.name);
}
