import { NextResponse } from "next/server";

import type { LiveCam } from "@/data/liveCams";

export const runtime = "nodejs";

const ALERTWEST_CAMERAS_URL = "https://alertwest.live/api/firecams/v0/cameras";
const ALERTWEST_LEGACY_URL = "https://alertwest.live/api/getCameraDataByLoc";
const MAX_SELECTED_CAMERAS = 18;
const MAX_SNAPSHOT_CHECKS = 28;
const SNAPSHOT_VERIFY_TIMEOUT_MS = 2500;

type AlertWestCamera = {
  name?: string;
  source?: string;
  site?: {
    id?: string;
    description?: string | null;
    latitude?: string;
    longitude?: string;
    county?: string | null;
    state?: string | null;
  };
  image?: {
    time?: string | null;
    url?: string | null;
  };
};

type LegacyAlertWestCamera = {
  id?: string;
  lid?: number;
  cn?: string;
  img?: string;
  off?: number;
  co?: string;
  st?: string;
  pr?: string;
};

type LegacyAlertWestLocation = {
  id?: number;
  lat?: string;
  lon?: string;
  st?: string;
};

type Candidate = {
  cam: LiveCam;
  score: number;
  text: string;
  sourceKind: "modern" | "legacy";
};

type ExclusionReason = "noImage" | "offline" | "notOceanRelevant" | "snapshotFailed";

type CameraSummary = {
  source: "modern" | "legacy" | "none";
  totalReturned: number;
  totalVerified: number;
  totalOceanVisible: number;
  selected: number;
  excluded: Record<ExclusionReason, number>;
  groups: Record<string, number>;
  failedThumbnails: string[];
  downgradedToExternalOnly: string[];
};

export async function GET() {
  const { cameras, summary } = await fetchAlertWestCameras();
  console.info("[OceanState cameras]", summary);
  return NextResponse.json({ cameras, summary });
}

async function fetchAlertWestCameras(): Promise<{ cameras: LiveCam[]; summary: CameraSummary }> {
  const modern = await fetchModernAlertWestCameras();
  if (modern.summary.totalReturned > 0) return modern;
  return fetchLegacyAlertWestCameras();
}

async function fetchModernAlertWestCameras(): Promise<{ cameras: LiveCam[]; summary: CameraSummary }> {
  const summary = createSummary("modern");
  try {
    const response = await fetch(ALERTWEST_CAMERAS_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return { cameras: [], summary };

    const payload = (await response.json()) as AlertWestCamera[];
    if (!Array.isArray(payload)) return { cameras: [], summary };
    summary.totalReturned = payload.length;

    const candidates = payload
      .map((camera, index) => buildModernCandidate(camera, index, summary))
      .filter((candidate): candidate is Candidate => Boolean(candidate))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SNAPSHOT_CHECKS);

    const cameras = await verifyCandidates(candidates, summary);
    return { cameras, summary: finishSummary(summary, cameras) };
  } catch {
    return { cameras: [], summary };
  }
}

async function fetchLegacyAlertWestCameras(): Promise<{ cameras: LiveCam[]; summary: CameraSummary }> {
  const summary = createSummary("legacy");
  try {
    const response = await fetch(ALERTWEST_LEGACY_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return { cameras: [], summary };

    const payload = await response.json();
    const cameras = payload?.data?.cams?.data as LegacyAlertWestCamera[] | undefined;
    const locations = payload?.data?.locs?.data as LegacyAlertWestLocation[] | undefined;
    if (!Array.isArray(cameras) || !Array.isArray(locations)) return { cameras: [], summary };

    summary.totalReturned = cameras.length;
    const locationById = new Map(locations.map((location) => [location.id, location]));
    const candidates = cameras
      .map((camera, index) => buildLegacyCandidate(camera, locationById.get(camera.lid), index, summary))
      .filter((candidate): candidate is Candidate => Boolean(candidate))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SNAPSHOT_CHECKS);

    const verified = await verifyCandidates(candidates, summary);
    return { cameras: verified, summary: finishSummary(summary, verified) };
  } catch {
    return { cameras: [], summary };
  }
}

function buildModernCandidate(camera: AlertWestCamera, index: number, summary: CameraSummary): Candidate | null {
  const text = normalizeText(cameraText(camera));
  if (!camera.image?.url) {
    summary.excluded.noImage += 1;
    return null;
  }

  const score = oceanRelevanceScore(text);
  if (score <= 0) {
    summary.excluded.notOceanRelevant += 1;
    return null;
  }

  const name = cleanCameraName(camera.name ?? camera.source ?? `AlertWest camera ${index + 1}`);
  const region = inferRegion(text);
  return {
    score,
    text,
      sourceKind: "modern",
      cam: {
        id: `alertwest-${slugify(name)}-${camera.site?.id ?? index}`,
        source: "ALERTWest",
        name,
        island: inferIsland(text),
        region,
        sourcePage: "https://alertwest.live/cameras",
        url: "https://alertwest.live/cameras",
        tags: inferTags(text, region),
      useCase: oceanUseCase(region),
      embedType: "snapshot",
      snapshotUrl: camera.image.url,
        refreshSeconds: 60,
        verified: false,
        oceanVisible: score > 0,
        oceanVisibilityScore: score,
        thumbnailWorking: false,
        notes: `ALERTWest public camera. Captured ${camera.image.time ?? "recently"}.`,
        priority: 20 + index,
    },
  };
}

function buildLegacyCandidate(
  camera: LegacyAlertWestCamera,
  location: LegacyAlertWestLocation | undefined,
  index: number,
  summary: CameraSummary,
): Candidate | null {
  const text = normalizeText(`${camera.cn ?? ""} ${camera.co ?? ""} ${camera.st ?? ""} ${camera.pr ?? ""} ${location?.st ?? ""} ${location?.lat ?? ""} ${location?.lon ?? ""}`);
  if (camera.off === 1) {
    summary.excluded.offline += 1;
    return null;
  }

  const snapshotUrl = buildLegacyImageUrl(camera);
  if (!snapshotUrl) {
    summary.excluded.noImage += 1;
    return null;
  }

  const score = oceanRelevanceScore(text);
  if (score <= 0) {
    summary.excluded.notOceanRelevant += 1;
    return null;
  }

  const name = cleanCameraName(camera.cn ?? `AlertWest camera ${index + 1}`);
  const region = inferRegion(text);
  return {
    score,
    text,
      sourceKind: "legacy",
      cam: {
        id: `alertwest-${slugify(name)}-${camera.id ?? index}`,
        source: "ALERTWest",
        name,
        island: inferIsland(text),
        region,
        sourcePage: "https://alertwest.live/cameras",
        url: "https://alertwest.live/cameras",
      tags: inferTags(text, region),
      useCase: oceanUseCase(region),
      embedType: "snapshot",
      snapshotUrl,
        refreshSeconds: 60,
        verified: false,
        oceanVisible: score > 0,
        oceanVisibilityScore: score,
        thumbnailWorking: false,
        notes: "ALERTWest public legacy camera image.",
        priority: 20 + index,
    },
  };
}

async function verifyCandidates(candidates: Candidate[], summary: CameraSummary): Promise<LiveCam[]> {
  const checked = await Promise.all(
    candidates.map(async (candidate) => {
      const ok = await verifySnapshotUrl(candidate.cam.snapshotUrl);
      if (!ok) {
        summary.excluded.snapshotFailed += 1;
        summary.failedThumbnails.push(candidate.cam.name);
        return null;
      }

      return {
        ...candidate.cam,
        verified: true,
        thumbnailWorking: true,
      };
    }),
  );

  const verified: LiveCam[] = [];
  for (const camera of checked) {
    if (camera) verified.push(camera);
  }
  return verified.slice(0, MAX_SELECTED_CAMERAS);
}

async function verifySnapshotUrl(url?: string) {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      headers: { accept: "image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(SNAPSHOT_VERIFY_TIMEOUT_MS),
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    return response.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}

function cameraText(camera: AlertWestCamera) {
  return [
    camera.name,
    camera.source,
    camera.site?.description,
    camera.site?.county,
    camera.site?.state,
    camera.site?.latitude,
    camera.site?.longitude,
  ]
    .filter(Boolean)
    .join(" ");
}

function oceanRelevanceScore(text: string) {
  let score = 0;

  const highPriority = [
    "kahului",
    "kanaha",
    "paia",
    "hookipa",
    "ho okipa",
    "sprecks",
    "maliko",
    "maalaea",
    "kihei",
    "wailea",
    "lahaina",
    "kaanapali",
    "napili",
    "hawaii kai",
  ];
  const oceanTerms = ["maui", "oahu", "harbor", "bay", "beach", "shore", "coast", "ocean", "channel", "lanai", "molokai", "makena", "north shore", "south side", "west side"];
  const lowerPriority = ["highway", "road", "airport", "inland", "mountain", "summit", "utility", "substation", "fire", "lookout", "tower"];

  for (const term of highPriority) if (text.includes(term)) score += 12;
  for (const term of oceanTerms) if (text.includes(term)) score += 4;
  for (const term of lowerPriority) if (text.includes(term)) score -= 4;

  return score;
}

function inferRegion(text: string): LiveCam["region"] {
  if (["kihei", "wailea", "makena", "maalaea"].some((keyword) => text.includes(keyword))) return "south-side";
  if (["lahaina", "kaanapali", "napili", "west maui"].some((keyword) => text.includes(keyword))) return "west-side";
  if (["kahului", "harbor"].some((keyword) => text.includes(keyword))) return "harbor";
  if (["molokai", "lanai", "pailolo", "alenuihaha", "channel", "hawaii kai"].some((keyword) => text.includes(keyword))) return "directory";
  if (["maui", "hookipa", "ho okipa", "paia", "sprecks", "maliko", "kanaha"].some((keyword) => text.includes(keyword))) return "north-shore";
  return "directory";
}

function inferIsland(text: string): LiveCam["island"] {
  if (text.includes("oahu") || text.includes("hawaii kai")) return "Oahu";
  if (text.includes("molokai")) return "Molokai";
  if (text.includes("lanai")) return "Lanai";
  if (text.includes("kauai")) return "Kauai";
  if (text.includes("hawaii island")) return "Hawaii";
  if (text.includes("maui") || ["kahului", "kanaha", "hookipa", "ho okipa", "kihei", "wailea", "lahaina", "maalaea"].some((keyword) => text.includes(keyword))) return "Maui";
  return "Unknown";
}

function inferTags(text: string, region: LiveCam["region"]) {
  const tags = ["alertwest", region];
  if (text.includes("maui")) tags.push("maui");
  if (text.includes("oahu") || text.includes("hawaii kai")) tags.push("oahu", "hawaii-kai");
  if (["kahului", "harbor"].some((keyword) => text.includes(keyword))) tags.push("harbor");
  if (["maliko", "kanaha", "downwind", "hawaii kai"].some((keyword) => text.includes(keyword))) tags.push("downwind");
  if (["beach", "surf", "shore"].some((keyword) => text.includes(keyword))) tags.push("surf");
  if (["channel", "molokai", "lanai", "pailolo", "alenuihaha"].some((keyword) => text.includes(keyword))) tags.push("channels");
  return [...new Set(tags)].filter((tag) => tag !== "directory");
}

function oceanUseCase(region: LiveCam["region"]) {
  if (region === "north-shore") return "Verify north shore cloud line, wind texture, visibility, and downwind surface.";
  if (region === "south-side") return "Verify south side visibility, sea texture, rain line, and run conditions.";
  if (region === "west-side") return "Verify west side visibility, coastline texture, and rain bands.";
  if (region === "harbor") return "Verify harbor visibility, rain line, entry texture, and wind on the water.";
  return "Verify channel/offshore visibility, cloud line, and marine conditions.";
}

function cleanCameraName(name: string) {
  return name.replace(/^Axis[-_\s]*/i, "").replaceAll("_", " ").trim();
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f']/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildLegacyImageUrl(camera: LegacyAlertWestCamera) {
  if (!camera.id || !camera.img) return undefined;
  const epoch = camera.img.match(/_(\d{10})_/)?.[1];
  if (!epoch) return undefined;
  const date = new Date(Number(epoch) * 1000);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `https://img.cdn.prod.alertwest.com/data/img/${camera.id}/${yyyy}/${mm}/${dd}/${camera.img}`;
}

function createSummary(source: CameraSummary["source"]): CameraSummary {
  return {
    source,
    totalReturned: 0,
    totalVerified: 0,
    totalOceanVisible: 0,
    selected: 0,
    excluded: {
      noImage: 0,
      offline: 0,
      notOceanRelevant: 0,
      snapshotFailed: 0,
    },
    groups: {},
    failedThumbnails: [],
    downgradedToExternalOnly: [],
  };
}

function finishSummary(summary: CameraSummary, cameras: LiveCam[]) {
  summary.totalVerified = cameras.filter((camera) => camera.verified).length;
  summary.totalOceanVisible = cameras.filter((camera) => camera.oceanVisible).length;
  summary.selected = cameras.length;
  summary.groups = cameras.reduce<Record<string, number>>((groups, camera) => {
    const group = groupName(camera.region);
    groups[group] = (groups[group] ?? 0) + 1;
    return groups;
  }, {});
  return summary;
}

function groupName(region: LiveCam["region"]) {
  if (region === "north-shore") return "NORTH SHORE";
  if (region === "south-side") return "SOUTH SIDE";
  if (region === "west-side") return "WEST SIDE";
  if (region === "harbor") return "HARBORS";
  return "CHANNELS / OFFSHORE VIEW";
}
