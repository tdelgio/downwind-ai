export type MauiZoneId =
  | "north-shore-maliko"
  | "south-shore-kihei-maalaea"
  | "west-maui"
  | "windward-hana"
  | "channels"
  | "maui-county-windward-waters"
  | "maui-county-leeward-waters";

export type SourceStatus = "live" | "mock" | "stub" | "error";

export type ScoreLevel = "great" | "good" | "caution" | "poor";

export interface SourceTimestamp {
  source: string;
  status: SourceStatus;
  updatedAt: string;
  note?: string;
}

export interface ForecastZone {
  id: MauiZoneId;
  name: string;
  shortName: string;
  description: string;
  nwsPoint?: {
    latitude: number;
    longitude: number;
  };
  marineZoneCode?: string;
}

export interface MarineForecast {
  zoneId: MauiZoneId;
  period: string;
  windDirection: string;
  windSpeedKt: number;
  gustKt?: number;
  seasFt: number;
  swellFt?: number;
  swellDirection?: string;
  swellPeriodSec?: number;
  rainChancePercent: number;
  clouds: "clear" | "few" | "partly" | "mostly" | "overcast";
  advisory?: string;
  summary: string;
  source: string;
  issuedAt: string;
}

export interface BuoyObservation {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  windDirectionDeg?: number;
  windSpeedKt?: number;
  gustKt?: number;
  waveHeightFt?: number;
  dominantPeriodSec?: number;
  waterTempF?: number;
  pressureMb?: number;
  status?: "data available" | "data missing";
  source: string;
}

export interface HarborWindObservation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  windDirection: string;
  windDirectionDeg?: number;
  windSpeedKt?: number;
  gustKt?: number;
  rainChancePercent?: number;
  clouds?: MarineForecast["clouds"];
  status: "data available" | "data missing";
  source: string;
}

export interface FADStatus {
  id: string;
  name: string;
  zoneId: MauiZoneId;
  island?: string;
  latitude?: number;
  longitude?: number;
  coordinateText?: string;
  distanceNm?: number;
  depthFathoms?: number;
  landmarks?: string[];
  status: "good" | "watch" | "unknown" | "offline";
  notes: string;
  lastCheckedAt: string;
  source: string;
}

export interface TideEvent {
  stationId: string;
  stationName: string;
  time: string;
  type: "high" | "low";
  heightFt: number;
  source: string;
}

export interface SurfForecast {
  shore: "north" | "west" | "south" | "east";
  area: string;
  today: string;
  tomorrow?: string;
  day3?: string;
  swellDirection: string;
  swellPeriod?: string;
  trend: string;
  wind: string;
  notes: string;
  source: string;
  issuedAt: string;
}

export interface MarineWarning {
  id: string;
  title: string;
  severity: "minor" | "moderate" | "severe";
  zones: MauiZoneId[];
  summary: string;
  effectiveAt: string;
  expiresAt?: string;
  source: string;
}

export interface MauiDailyReport {
  date: string;
  headline: string;
  humanSummary: string;
  zones: ForecastZone[];
  forecasts: MarineForecast[];
  buoys: BuoyObservation[];
  harborWinds: HarborWindObservation[];
  fads: FADStatus[];
  tides: TideEvent[];
  surf: SurfForecast[];
  warnings: MarineWarning[];
  sourceTimestamps: SourceTimestamp[];
}
