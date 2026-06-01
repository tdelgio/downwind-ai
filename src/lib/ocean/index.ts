import { getCoopsCurrentObservation, getCoopsTideObservation } from "./coops";
import { getMauiCoastalWinds } from "./coastal";
import { getMauiHarborWinds } from "./harbors";
import { createMockOceanSnapshot, malikoNorthShoreRoute } from "./mock-data";
import { getNdbcObservations } from "./ndbc";
import { getNwsAlerts, getNwsForecastWindows } from "./nws";
import { scoreRoute } from "./scoring";
import type { MauiShoreId, OceanConditionSnapshot, OceanIntelligenceResult, OffshoreBuoyId, OffshoreBuoyObservation, RouteConfig, ShoreOceanObservations } from "./types";

export type {
  ForecastWindow,
  OceanConditionSnapshot,
  OceanIntelligenceResult,
  RouteConfig,
  RouteScore,
  HarborWindObservation,
  CoastalWindObservation,
  MauiShoreId,
  OffshoreBuoyId,
  OffshoreBuoyObservation,
  CurrentObservation,
  SeaEnergyObservation,
  ShoreOceanObservations,
  SwellObservation,
  TideObservation,
  WindObservation,
} from "./types";

export { malikoNorthShoreRoute } from "./mock-data";
export { getNdbcObservations } from "./ndbc";
export { getCoopsTideObservation } from "./coops";
export { getCoopsCurrentObservation } from "./coops";
export { getMauiCoastalWinds } from "./coastal";
export { getMauiHarborWinds } from "./harbors";
export { getNwsAlerts, getNwsForecastWindows } from "./nws";
export { scoreRoute } from "./scoring";

const SNAPSHOT_CACHE_TTL_MS = 5 * 60 * 1000;
let snapshotCache:
  | {
      routeId: string;
      expiresAt: number;
      snapshot: OceanConditionSnapshot;
    }
  | null = null;
let inFlightSnapshot: Promise<OceanConditionSnapshot> | null = null;

export async function getOceanIntelligence(route: RouteConfig = malikoNorthShoreRoute): Promise<OceanIntelligenceResult> {
  const snapshot = await getOceanConditionSnapshot(route);
  return {
    snapshot,
    score: scoreRoute(snapshot),
  };
}

export async function getOceanConditionSnapshot(route: RouteConfig = malikoNorthShoreRoute): Promise<OceanConditionSnapshot> {
  const now = Date.now();
  if (snapshotCache?.routeId === route.id && snapshotCache.expiresAt > now) {
    return snapshotCache.snapshot;
  }

  if (inFlightSnapshot) {
    return inFlightSnapshot;
  }

  inFlightSnapshot = loadOceanConditionSnapshot(route)
    .then((snapshot) => {
      snapshotCache = {
        routeId: route.id,
        expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
        snapshot,
      };
      return snapshot;
    })
    .finally(() => {
      inFlightSnapshot = null;
    });

  return inFlightSnapshot;
}

async function loadOceanConditionSnapshot(route: RouteConfig): Promise<OceanConditionSnapshot> {
  try {
    const [buoy, southBuoy, openOceanNwBuoy, tide, current, coastalWinds, harborWinds, forecastWindows, alerts] = await Promise.all([
      getNdbcObservations(route.stations.primaryBuoyId),
      getNdbcObservations("51213"),
      getNdbcObservations("51001"),
      getCoopsTideObservation(route.stations.tideStationId),
      getCoopsCurrentObservation(route.stations.currentStationId),
      getMauiCoastalWinds(),
      getMauiHarborWinds(),
      getNwsForecastWindows(route.stations.nwsPoint),
      getNwsAlerts(route.stations.nwsPoint),
    ]);
    const generatedAt = new Date().toISOString();
    const kiheiWind = coastalWinds.find((coastal) => coastal.id === "kihei")?.observation;
    const lahainaWind = coastalWinds.find((coastal) => coastal.id === "lahaina")?.observation;
    const shoreObservations: Record<MauiShoreId, ShoreOceanObservations> = {
      north: createShoreObservations("north", "North Shore", route.stations.primaryBuoyId, buoy),
      south: createShoreObservations("south", "South Side", "51213", southBuoy, kiheiWind),
      west: createShoreObservations("west", "West Side", "51213", southBuoy, lahainaWind),
    };
    const offshoreObservations: Record<OffshoreBuoyId, OffshoreBuoyObservation> = {
      "lanai-offshore": createOffshoreBuoyObservation(
        "lanai-offshore",
        "Lanai Offshore",
        "Outer channel validation buoy between Molokai and Lanai.",
        "51213",
        southBuoy,
      ),
      "open-ocean-nw": createOffshoreBuoyObservation(
        "open-ocean-nw",
        "Open Ocean NW",
        "Early North Pacific groundswell detection before Maui arrival.",
        "51001",
        openOceanNwBuoy,
      ),
    };

    return {
      route,
      generatedAt,
      wind: buoy.wind,
      swell: buoy.swell,
      groundswell: buoy.groundswell,
      bumpEnergy: buoy.bumpEnergy,
      tide,
      current,
      shoreObservations,
      offshoreObservations,
      coastalWinds,
      harborWinds,
      forecastWindows,
      alerts,
      sources: [
        buoy.wind.source,
        buoy.swell.source,
        buoy.bumpEnergy.source,
        buoy.groundswell.source,
        southBuoy.wind.source,
        southBuoy.swell.source,
        southBuoy.bumpEnergy.source,
        southBuoy.groundswell.source,
        openOceanNwBuoy.wind.source,
        openOceanNwBuoy.swell.source,
        openOceanNwBuoy.bumpEnergy.source,
        openOceanNwBuoy.groundswell.source,
        tide.source,
        current.source,
        ...coastalWinds.map((coastal) => coastal.observation.source),
        ...harborWinds.map((harbor) => harbor.observation.source),
        ...forecastWindows.map((window) => window.source),
        ...alerts.map((alert) => alert.source),
      ],
    };
  } catch {
    return createMockOceanSnapshot(route);
  }
}

function createOffshoreBuoyObservation(
  id: OffshoreBuoyId,
  displayName: string,
  purpose: string,
  stationId: string,
  observations: Awaited<ReturnType<typeof getNdbcObservations>>,
): OffshoreBuoyObservation {
  return {
    id,
    displayName,
    purpose,
    stationId,
    wind: observations.wind,
    swell: observations.swell,
    groundswell: observations.groundswell,
    bumpEnergy: observations.bumpEnergy,
  };
}

function createShoreObservations(
  shoreId: MauiShoreId,
  label: string,
  buoyId: string,
  observations: Awaited<ReturnType<typeof getNdbcObservations>>,
  coastalWind?: ShoreOceanObservations["wind"],
): ShoreOceanObservations {
  return {
    shoreId,
    label,
    buoyId,
    wind: coastalWind ?? observations.wind,
    swell: observations.swell,
    groundswell: observations.groundswell,
    bumpEnergy: observations.bumpEnergy,
  };
}
