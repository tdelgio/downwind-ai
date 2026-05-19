import type { ForecastWindow, OceanConditionSnapshot, RouteConfig, SwellObservation, TideObservation, WindObservation } from "./types";

export const malikoNorthShoreRoute: RouteConfig = {
  id: "maui-maliko-north-shore",
  name: "Maliko / North Shore Maui",
  region: "Maui",
  start: { latitude: 20.941, longitude: -156.284 },
  finish: { latitude: 20.895, longitude: -156.469 },
  idealWindDirectionDeg: 75,
  idealWindDirectionToleranceDeg: 35,
  idealWindSpeedRangeKt: [18, 28],
  maxComfortableGustKt: 35,
  idealSwellDirectionDeg: 75,
  idealSwellDirectionToleranceDeg: 50,
  idealSwellHeightRangeFt: [3, 8],
  preferredTideTrend: ["falling", "slack"],
  stations: {
    // Pauwela buoy is the first Maui north shore ocean proxy. Confirm operational station IDs per route before production.
    primaryBuoyId: "51205",
    // Kahului Harbor / NOAA NOS 1615680 / NDBC KLIH1 is useful for finish-area wind.
    finishWindStationId: "KLIH1",
    // Kahului Harbor is the initial nearby CO-OPS tide station placeholder.
    tideStationId: "1615680",
    nwsPoint: { latitude: 20.941, longitude: -156.284 },
  },
};

const now = "2026-05-18T08:00:00-10:00";

export const mockWindObservation: WindObservation = {
  speedKt: 21,
  gustKt: 29,
  directionDeg: 75,
  directionCardinal: "ENE",
  source: {
    source: "Mock NDBC 51205",
    status: "mock",
    stationId: "51205",
    fetchedAt: now,
    observedAt: "2026-05-18T07:40:00-10:00",
    freshnessMinutes: 20,
  },
};

export const mockSwellObservation: SwellObservation = {
  heightFt: 5.8,
  dominantPeriodSec: 10,
  directionDeg: 70,
  directionCardinal: "ENE",
  waterTempF: 78.2,
  source: {
    source: "Mock NDBC 51205",
    status: "mock",
    stationId: "51205",
    fetchedAt: now,
    observedAt: "2026-05-18T07:40:00-10:00",
    freshnessMinutes: 20,
  },
};

export const mockTideObservation: TideObservation = {
  stationId: "1615680",
  stationName: "Kahului, Kahului Harbor, HI",
  currentWaterLevelFt: 1.1,
  trend: "falling",
  nextHigh: { time: "2026-05-18T13:42:00-10:00", heightFt: 1.8, type: "high" },
  nextLow: { time: "2026-05-18T19:56:00-10:00", heightFt: 0.5, type: "low" },
  predictions: [
    { time: "2026-05-18T07:18:00-10:00", heightFt: 0.3, type: "low" },
    { time: "2026-05-18T13:42:00-10:00", heightFt: 1.8, type: "high" },
    { time: "2026-05-18T19:56:00-10:00", heightFt: 0.5, type: "low" },
  ],
  source: {
    source: "Mock NOAA CO-OPS 1615680",
    status: "mock",
    stationId: "1615680",
    fetchedAt: now,
    observedAt: now,
    freshnessMinutes: 0,
  },
};

export const mockForecastWindows: ForecastWindow[] = [
  {
    startTime: "2026-05-18T11:00:00-10:00",
    endTime: "2026-05-18T14:00:00-10:00",
    windSpeedKt: 20,
    windGustKt: 28,
    windDirectionDeg: 75,
    windDirectionCardinal: "ENE",
    precipitationChancePercent: 25,
    shortForecast: "ENE trades with passing windward showers.",
    source: {
      source: "Mock NWS hourly forecast",
      status: "mock",
      fetchedAt: now,
      observedAt: now,
      freshnessMinutes: 0,
    },
  },
  {
    startTime: "2026-05-18T14:00:00-10:00",
    endTime: "2026-05-18T17:00:00-10:00",
    windSpeedKt: 24,
    windGustKt: 33,
    windDirectionDeg: 80,
    windDirectionCardinal: "E",
    precipitationChancePercent: 35,
    shortForecast: "Stronger trades, more gust spread near squalls.",
    source: {
      source: "Mock NWS hourly forecast",
      status: "mock",
      fetchedAt: now,
      observedAt: now,
      freshnessMinutes: 0,
    },
  },
];

export function createMockOceanSnapshot(route: RouteConfig = malikoNorthShoreRoute): OceanConditionSnapshot {
  return {
    route,
    generatedAt: now,
    wind: mockWindObservation,
    swell: mockSwellObservation,
    tide: mockTideObservation,
    forecastWindows: mockForecastWindows,
    alerts: [],
    sources: [mockWindObservation.source, mockSwellObservation.source, mockTideObservation.source, ...mockForecastWindows.map((window) => window.source)],
  };
}
