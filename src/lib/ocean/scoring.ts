import type { ForecastWindow, OceanConditionSnapshot, RouteScore } from "./types";

export function scoreRoute(snapshot: OceanConditionSnapshot): RouteScore {
  const windAlignmentScore = scoreDirectionalAlignment(snapshot.wind.directionDeg, snapshot.route.idealWindDirectionDeg, snapshot.route.idealWindDirectionToleranceDeg);
  const swellAlignmentScore = scoreDirectionalAlignment(snapshot.swell.directionDeg, snapshot.route.idealSwellDirectionDeg, snapshot.route.idealSwellDirectionToleranceDeg);
  const windPowerScore = scoreRange(snapshot.wind.speedKt, snapshot.route.idealWindSpeedRangeKt);
  const swellHeightScore = scoreRange(snapshot.swell.heightFt, snapshot.route.idealSwellHeightRangeFt);
  const tideWindowScore = snapshot.route.preferredTideTrend.includes(snapshot.tide.trend) ? 90 : snapshot.tide.trend === "unknown" ? 45 : 60;
  const dataConfidenceScore = scoreDataConfidence(snapshot);
  const bestLaunchWindow = findBestLaunchWindow(snapshot.forecastWindows, snapshot);
  const runQualityScore = Math.round(
    windAlignmentScore * 0.24 +
      windPowerScore * 0.22 +
      swellAlignmentScore * 0.16 +
      swellHeightScore * 0.14 +
      tideWindowScore * 0.1 +
      dataConfidenceScore * 0.14,
  );
  const missingData = getMissingData(snapshot);

  return {
    routeId: snapshot.route.id,
    generatedAt: snapshot.generatedAt,
    runQualityScore,
    windAlignmentScore,
    swellAlignmentScore,
    tideWindowScore,
    dataConfidenceScore,
    bestLaunchWindow,
    riskLevel: riskLevelFor(runQualityScore, snapshot),
    recommendation: buildRecommendation(runQualityScore, bestLaunchWindow, missingData),
    reasons: buildReasons(snapshot, windAlignmentScore, swellAlignmentScore, tideWindowScore),
    missingData,
  };
}

function findBestLaunchWindow(windows: ForecastWindow[], snapshot: OceanConditionSnapshot): ForecastWindow | null {
  if (!windows.length) return null;
  return [...windows].sort((a, b) => scoreWindow(b, snapshot) - scoreWindow(a, snapshot))[0] ?? null;
}

function scoreWindow(window: ForecastWindow, snapshot: OceanConditionSnapshot): number {
  const windAlignment = scoreDirectionalAlignment(window.windDirectionDeg, snapshot.route.idealWindDirectionDeg, snapshot.route.idealWindDirectionToleranceDeg);
  const windPower = scoreRange(window.windSpeedKt, snapshot.route.idealWindSpeedRangeKt);
  const gustPenalty = window.windGustKt && window.windGustKt > snapshot.route.maxComfortableGustKt ? 20 : 0;
  const rainPenalty = window.precipitationChancePercent ? Math.min(25, window.precipitationChancePercent / 2) : 0;
  return windAlignment * 0.45 + windPower * 0.45 - gustPenalty - rainPenalty;
}

function scoreDirectionalAlignment(actual: number | null, ideal: number, tolerance: number): number {
  if (actual === null) return 40;
  const difference = Math.abs(((actual - ideal + 540) % 360) - 180);
  if (difference >= tolerance * 2) return 0;
  return Math.max(0, Math.round(100 - (difference / (tolerance * 2)) * 100));
}

function scoreRange(value: number | null, [min, max]: [number, number]): number {
  if (value === null) return 40;
  if (value >= min && value <= max) return 100;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, Math.round(100 - distance * 12));
}

function scoreDataConfidence(snapshot: OceanConditionSnapshot): number {
  const fields = [
    snapshot.wind.speedKt,
    snapshot.wind.directionDeg,
    snapshot.swell.heightFt,
    snapshot.swell.dominantPeriodSec,
    snapshot.tide.currentWaterLevelFt,
    snapshot.forecastWindows.length ? 1 : null,
  ];
  const present = fields.filter((value) => value !== null).length;
  const freshnessPenalty = snapshot.sources.some((source) => source.freshnessMinutes !== undefined && source.freshnessMinutes > 90) ? 15 : 0;
  return Math.max(0, Math.round((present / fields.length) * 100 - freshnessPenalty));
}

function getMissingData(snapshot: OceanConditionSnapshot): string[] {
  const missing: string[] = [];
  if (snapshot.wind.speedKt === null) missing.push("wind speed");
  if (snapshot.wind.directionDeg === null) missing.push("wind direction");
  if (snapshot.swell.heightFt === null) missing.push("swell height");
  if (snapshot.swell.dominantPeriodSec === null) missing.push("swell period");
  if (snapshot.tide.currentWaterLevelFt === null) missing.push("current tide level");
  if (!snapshot.forecastWindows.length) missing.push("hourly forecast");
  return missing;
}

function riskLevelFor(score: number, snapshot: OceanConditionSnapshot) {
  if (snapshot.alerts.length > 0 || (snapshot.wind.gustKt !== null && snapshot.wind.gustKt > snapshot.route.maxComfortableGustKt)) return "high";
  if (score >= 75) return "low";
  if (score >= 55) return "moderate";
  return "high";
}

function buildRecommendation(score: number, window: ForecastWindow | null, missingData: string[]): string {
  if (missingData.length >= 3) return `Data is incomplete: ${missingData.join(", ")}. Treat this as a limited read.`;
  if (!window) return "No launch window found from the available hourly forecast.";
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(window.startTime));
  if (score >= 75) return `Best raw window starts around ${time}. Wind and ocean signals are reasonably aligned for this route.`;
  if (score >= 55) return `Possible window around ${time}, but review gusts, rain, and local crew comfort.`;
  return "Conditions do not line up cleanly from the available public data.";
}

function buildReasons(snapshot: OceanConditionSnapshot, windAlignment: number, swellAlignment: number, tideScore: number): string[] {
  return [
    `Wind alignment score: ${windAlignment}/100 from ${snapshot.wind.directionCardinal ?? "unknown"} wind.`,
    `Swell alignment score: ${swellAlignment}/100 from ${snapshot.swell.directionCardinal ?? "unknown"} swell.`,
    `Tide window score: ${tideScore}/100 with tide trend ${snapshot.tide.trend}.`,
  ];
}
