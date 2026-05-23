import { getCoopsCurrentObservation, getCoopsTideObservation } from "./coops";
import { getMauiHarborWinds } from "./harbors";
import { createMockOceanSnapshot, malikoNorthShoreRoute } from "./mock-data";
import { getNdbcObservations } from "./ndbc";
import { getNwsAlerts, getNwsForecastWindows } from "./nws";
import { scoreRoute } from "./scoring";
import type { OceanConditionSnapshot, OceanIntelligenceResult, RouteConfig } from "./types";

export type {
  ForecastWindow,
  OceanConditionSnapshot,
  OceanIntelligenceResult,
  RouteConfig,
  RouteScore,
  HarborWindObservation,
  CurrentObservation,
  SeaEnergyObservation,
  SwellObservation,
  TideObservation,
  WindObservation,
} from "./types";

export { malikoNorthShoreRoute } from "./mock-data";
export { getNdbcObservations } from "./ndbc";
export { getCoopsTideObservation } from "./coops";
export { getCoopsCurrentObservation } from "./coops";
export { getMauiHarborWinds } from "./harbors";
export { getNwsAlerts, getNwsForecastWindows } from "./nws";
export { scoreRoute } from "./scoring";

export async function getOceanIntelligence(route: RouteConfig = malikoNorthShoreRoute): Promise<OceanIntelligenceResult> {
  const snapshot = await getOceanConditionSnapshot(route);
  return {
    snapshot,
    score: scoreRoute(snapshot),
  };
}

export async function getOceanConditionSnapshot(route: RouteConfig = malikoNorthShoreRoute): Promise<OceanConditionSnapshot> {
  try {
    const [buoy, tide, current, harborWinds, forecastWindows, alerts] = await Promise.all([
      getNdbcObservations(route.stations.primaryBuoyId),
      getCoopsTideObservation(route.stations.tideStationId),
      getCoopsCurrentObservation(route.stations.currentStationId),
      getMauiHarborWinds(),
      getNwsForecastWindows(route.stations.nwsPoint),
      getNwsAlerts(route.stations.nwsPoint),
    ]);
    const generatedAt = new Date().toISOString();

    return {
      route,
      generatedAt,
      wind: buoy.wind,
      swell: buoy.swell,
      groundswell: buoy.groundswell,
      bumpEnergy: buoy.bumpEnergy,
      tide,
      current,
      harborWinds,
      forecastWindows,
      alerts,
      sources: [
        buoy.wind.source,
        buoy.swell.source,
        buoy.bumpEnergy.source,
        buoy.groundswell.source,
        tide.source,
        current.source,
        ...harborWinds.map((harbor) => harbor.observation.source),
        ...forecastWindows.map((window) => window.source),
        ...alerts.map((alert) => alert.source),
      ],
    };
  } catch {
    return createMockOceanSnapshot(route);
  }
}
