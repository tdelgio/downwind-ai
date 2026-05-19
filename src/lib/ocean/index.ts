import { getCoopsTideObservation } from "./coops";
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
  SwellObservation,
  TideObservation,
  WindObservation,
} from "./types";

export { malikoNorthShoreRoute } from "./mock-data";
export { getNdbcObservations } from "./ndbc";
export { getCoopsTideObservation } from "./coops";
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
    const [buoy, tide, forecastWindows, alerts] = await Promise.all([
      getNdbcObservations(route.stations.primaryBuoyId),
      getCoopsTideObservation(route.stations.tideStationId),
      getNwsForecastWindows(route.stations.nwsPoint),
      getNwsAlerts(route.stations.nwsPoint),
    ]);
    const generatedAt = new Date().toISOString();

    return {
      route,
      generatedAt,
      wind: buoy.wind,
      swell: buoy.swell,
      tide,
      forecastWindows,
      alerts,
      sources: [
        buoy.wind.source,
        buoy.swell.source,
        tide.source,
        ...forecastWindows.map((window) => window.source),
        ...alerts.map((alert) => alert.source),
      ],
    };
  } catch {
    return createMockOceanSnapshot(route);
  }
}
