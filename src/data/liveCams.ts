export type LiveCam = {
  id: string;
  source: "ALERTWest" | "GoAkamai" | "NOAA/NWS" | "Windy";
  name: string;
  island?: "Maui" | "Oahu" | "Hawaii" | "Kauai" | "Molokai" | "Lanai" | "Unknown";
  region: "north-shore" | "south-side" | "west-side" | "harbor" | "directory";
  sourcePage: string;
  url: string;
  tags: string[];
  useCase: string;
  embedType: "external" | "iframe" | "snapshot" | "mjpeg" | "hls";
  snapshotUrl?: string;
  streamUrl?: string;
  embedUrl?: string;
  previewImageUrl?: string;
  refreshSeconds: number;
  verified: boolean;
  oceanVisible?: boolean;
  oceanVisibilityScore?: number;
  thumbnailWorking?: boolean;
  notes: string;
  priority: number;
};

export const liveCams: LiveCam[] = [];
