import { getMetarWindObservation } from "./metar";
import { getNwsCurrentWindObservation } from "./nws";
import type { CoastalWindObservation, WindObservation } from "./types";

type CoastalWindConfig = {
  id: string;
  name: string;
  profile: CoastalWindObservation["profile"];
  coordinates: CoastalWindObservation["coordinates"];
  metarStationId?: string;
  note: string;
};

const coastalWindConfigs: CoastalWindConfig[] = [
  {
    id: "kanaha",
    name: "Kanaha",
    profile: "beach-launch",
    coordinates: { latitude: 20.898, longitude: -156.437 },
    metarStationId: "PHOG",
    note: "Kanaha nearshore profile: PHOG airport wind first, NWS coastal grid fallback. Not shared with Kahului Harbor.",
  },
  {
    id: "kihei",
    name: "Kihei",
    profile: "beach-launch",
    coordinates: { latitude: 20.756, longitude: -156.457 },
    note: "Kihei nearshore profile: NWS coastal grid for South Side finish conditions.",
  },
];

const COASTAL_WIND_CACHE_TTL_MS = 5 * 60 * 1000;
let coastalWindCache:
  | {
      expiresAt: number;
      observations: CoastalWindObservation[];
    }
  | null = null;
let inFlightCoastalWinds: Promise<CoastalWindObservation[]> | null = null;

export async function getMauiCoastalWinds(): Promise<CoastalWindObservation[]> {
  const now = Date.now();
  if (coastalWindCache && coastalWindCache.expiresAt > now) {
    return coastalWindCache.observations;
  }

  if (inFlightCoastalWinds) return inFlightCoastalWinds;

  inFlightCoastalWinds = Promise.all(coastalWindConfigs.map(getCoastalWind))
    .then((observations) => {
      coastalWindCache = {
        expiresAt: Date.now() + COASTAL_WIND_CACHE_TTL_MS,
        observations,
      };
      return observations;
    })
    .finally(() => {
      inFlightCoastalWinds = null;
    });

  return inFlightCoastalWinds;
}

async function getCoastalWind(config: CoastalWindConfig): Promise<CoastalWindObservation> {
  const observation = await getCoastalWindObservation(config);
  return {
    id: config.id,
    name: config.name,
    profile: config.profile,
    coordinates: config.coordinates,
    observation,
    note: config.note,
  };
}

async function getCoastalWindObservation(config: CoastalWindConfig): Promise<WindObservation> {
  if (config.metarStationId) {
    const metar = await getMetarWindObservation(config.metarStationId, config.name);
    if (metar.source.status === "live") return metar;
  }

  const nws = await getNwsCurrentWindObservation(config.coordinates, `${config.name} coastal grid`);
  return {
    ...nws,
    source: {
      ...nws.source,
      source: `NWS coastal grid · ${config.name}`,
    },
  };
}
