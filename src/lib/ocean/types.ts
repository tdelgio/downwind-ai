export type DataSourceStatus = "live" | "mock" | "stale" | "missing" | "error";

export type TideTrend = "rising" | "falling" | "slack" | "unknown";

export type RouteRiskLevel = "low" | "moderate" | "high" | "unknown";

export interface SourceMeta {
  source: string;
  status: DataSourceStatus;
  stationId?: string;
  fetchedAt: string;
  observedAt?: string;
  freshnessMinutes?: number;
  error?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface WindObservation {
  speedKt: number | null;
  gustKt: number | null;
  directionDeg: number | null;
  directionCardinal: string | null;
  source: SourceMeta;
}

export interface HarborWindObservation {
  id: string;
  name: string;
  side: "north" | "south" | "west" | "central";
  coordinates: GeoPoint;
  observation: WindObservation;
  note: string;
}

export interface SwellObservation {
  heightFt: number | null;
  dominantPeriodSec: number | null;
  directionDeg: number | null;
  directionCardinal: string | null;
  waterTempF: number | null;
  source: SourceMeta;
}

export interface SeaEnergyObservation {
  label: "groundswell" | "bump-energy";
  heightFt: number | null;
  periodSec: number | null;
  directionDeg: number | null;
  directionCardinal: string | null;
  description: string;
  source: SourceMeta;
}

export interface TideEvent {
  time: string;
  heightFt: number;
  type: "high" | "low";
}

export interface TideObservation {
  stationId: string;
  stationName: string;
  currentWaterLevelFt: number | null;
  trend: TideTrend;
  nextHigh: TideEvent | null;
  nextLow: TideEvent | null;
  predictions: TideEvent[];
  source: SourceMeta;
}

export interface CurrentObservation {
  stationId: string;
  stationName: string;
  speedKt: number | null;
  directionDeg: number | null;
  directionCardinal: string | null;
  trend: "flood" | "ebb" | "slack" | "unknown";
  source: SourceMeta;
}

export interface ForecastWindow {
  startTime: string;
  endTime: string;
  windSpeedKt: number | null;
  windGustKt: number | null;
  windDirectionDeg: number | null;
  windDirectionCardinal: string | null;
  precipitationChancePercent: number | null;
  shortForecast: string;
  source: SourceMeta;
}

export interface WeatherAlert {
  id: string;
  headline: string;
  severity: string;
  event: string;
  effectiveAt: string | null;
  expiresAt: string | null;
  description: string;
  source: SourceMeta;
}

export interface RouteConfig {
  id: string;
  name: string;
  region: string;
  start: GeoPoint;
  finish: GeoPoint;
  idealWindDirectionDeg: number;
  idealWindDirectionToleranceDeg: number;
  idealWindSpeedRangeKt: [number, number];
  maxComfortableGustKt: number;
  idealSwellDirectionDeg: number;
  idealSwellDirectionToleranceDeg: number;
  idealSwellHeightRangeFt: [number, number];
  preferredTideTrend: TideTrend[];
  stations: {
    // Configure real NOAA/NDBC station IDs here as the product expands.
    primaryBuoyId: string;
    finishWindStationId?: string;
    tideStationId: string;
    // NOAA CO-OPS currents station/bin placeholders should be configured per channel/harbor.
    currentStationId?: string;
    nwsPoint: GeoPoint;
  };
}

export interface OceanConditionSnapshot {
  route: RouteConfig;
  generatedAt: string;
  wind: WindObservation;
  swell: SwellObservation;
  groundswell: SeaEnergyObservation;
  bumpEnergy: SeaEnergyObservation;
  tide: TideObservation;
  current: CurrentObservation;
  harborWinds: HarborWindObservation[];
  forecastWindows: ForecastWindow[];
  alerts: WeatherAlert[];
  sources: SourceMeta[];
}

export interface RouteScore {
  routeId: string;
  generatedAt: string;
  runQualityScore: number;
  windAlignmentScore: number;
  swellAlignmentScore: number;
  tideWindowScore: number;
  dataConfidenceScore: number;
  bestLaunchWindow: ForecastWindow | null;
  riskLevel: RouteRiskLevel;
  recommendation: string;
  reasons: string[];
  missingData: string[];
}

export interface OceanIntelligenceResult {
  snapshot: OceanConditionSnapshot;
  score: RouteScore;
}
