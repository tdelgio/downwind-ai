import type { FADStatus, SourceTimestamp } from "@/lib/types";

export const hawaiiFadsHomeUrl = "https://www.himb.hawaii.edu/FADS/";
export const mauiFadsListUrl = "https://www.himb.hawaii.edu/FADS/Maps%20%26%20Loc/MauiFADS.html";
export const mauiFadsMapUrl = "https://www.himb.hawaii.edu/FADS/Maps%20%26%20Loc/MauiMap.html";

export async function fetchHawaiiFadsHomePage() {
  const response = await fetch(hawaiiFadsHomeUrl, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`Hawaii FADS home fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function fetchMauiFadsPage() {
  const response = await fetch(mauiFadsListUrl, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`Hawaii FADS fetch failed: ${response.status}`);
  }

  return response.text();
}

export function parseMauiFads(): FADStatus[] {
  // TODO: Parse HIMB Maui FAD table and map coordinates into normalized FADStatus entries.
  return [];
}

export function createOfficialMauiFads(lastCheckedAt: string): FADStatus[] {
  return [
    {
      id: "dd-opana",
      name: "'Opana Pt. DD",
      island: "Maui",
      zoneId: "north-shore-maliko",
      latitude: 21.035,
      longitude: -156.2567,
      coordinateText: "21-02.1N, 156-15.4W",
      depthFathoms: 203,
      landmarks: ["Nakalele Pt. Lt. 78.0 deg / 19.1 nm", "Kahului Bay Lt. 45.5 deg / 14.8 nm", "Pa'uwela Pt. Lt. 25.0 deg / 6.5 nm", "'Opiko'ula Pt. 313.0 deg / 15.6 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "ff-pukaulua",
      name: "Pukaulua Pt. FF",
      island: "Maui",
      zoneId: "windward-hana",
      latitude: 20.8353,
      longitude: -155.7317,
      coordinateText: "20-50.12N, 155-43.9W",
      depthFathoms: 828,
      landmarks: ["'Opiko'ula Pt. 73.0 deg / 13.5 nm", "Hana Bay Lt. 43.0 deg / 9.3 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "ho-hoolawa",
      name: "Ho'olawa Pt. HO",
      island: "Maui",
      zoneId: "north-shore-maliko",
      latitude: 20.94,
      longitude: -156.0133,
      coordinateText: "20-56.4N, 156-00.8W",
      depthFathoms: 550,
      landmarks: ["Pa'uwela Pt. Lt. 71.0 deg / 15.2 nm", "Ke'anae Pt. 26.0 deg / 9.0 nm", "Pukaulua Pt. 335.0 deg / 11.8 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "hs-halona",
      name: "Halona HS",
      island: "Maui",
      zoneId: "south-shore-kihei-maalaea",
      latitude: 20.4917,
      longitude: -156.2673,
      coordinateText: "20-29.5N, 156-16.04W",
      depthFathoms: 650,
      landmarks: ["Apole Pt. 204.0 deg / 9.7 nm", "Naka'ohu Pt. 174.0 deg / 6.4 nm", "La Perouse Lt. 112.5 deg / 10.0 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "la-lahaina",
      name: "Lahaina LA",
      island: "Maui",
      zoneId: "west-maui",
      latitude: 20.6833,
      longitude: -156.7083,
      coordinateText: "20-41.0N, 156-42.5W",
      depthFathoms: 110,
      landmarks: ["Lahaina Lt. 178.0 deg / 11.5 nm", "McGregor Pt. Lt. 230.0 deg / 12.0 nm", "Molokini 273.8 deg / 12.3 nm", "Manele Bay Lt. 99.0 deg / 10.8 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "m-hana",
      name: "Hana Bay M",
      island: "Maui",
      zoneId: "windward-hana",
      latitude: 20.7483,
      longitude: -155.8417,
      coordinateText: "20-44.9N, 155-50.5W",
      depthFathoms: 700,
      landmarks: ["Hana Bay Lt. 85.0 deg / 8.0 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "nl-nuu",
      name: "Nu'u Landing NL",
      island: "Maui",
      zoneId: "south-shore-kihei-maalaea",
      latitude: 20.5483,
      longitude: -156.1583,
      coordinateText: "20-32.9N, 156-09.5W",
      depthFathoms: 664,
      landmarks: ["Apole Pt. 152.0 deg / 4.4 nm", "Naka'ohu Pt. 104.0 deg / 7.0 nm", "Puhilele Pt. 212.0 deg / 8.4 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
    {
      id: "q-pauwela",
      name: "Pa'uwela Pt. Q",
      island: "Maui",
      zoneId: "north-shore-maliko",
      latitude: 21.1417,
      longitude: -156.1283,
      coordinateText: "21-08.5N, 156-07.7W",
      depthFathoms: 907,
      landmarks: ["Nakalele Pt. Lt. 69.0 deg / 23.0 nm", "Kahului Bay Lt. 47.0 deg / 19.5 nm", "Pa'uwela Pt. Lt. 30.0 deg / 12.0 nm", "Nanualele Pt. Lt. 320.0 deg / 23.1 nm"],
      status: "unknown",
      notes: "Official Maui FAD location. Live status is not confirmed yet.",
      lastCheckedAt,
      source: "Hawaii FADS official coordinates",
    },
  ];
}

export const fadsSourceTimestamp: SourceTimestamp = {
  source: "Hawaii FADS home + Maui list/map",
  status: "stub",
  updatedAt: new Date().toISOString(),
  note: "Official Maui FAD locations are loaded; live status parsing is still TODO.",
};
