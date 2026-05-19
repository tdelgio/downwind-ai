import type { ForecastZone } from "@/lib/types";

export const mauiZones: ForecastZone[] = [
  {
    id: "north-shore-maliko",
    name: "North Shore / Maliko Harbor",
    shortName: "Maliko Harbor",
    description: "Maliko Harbor, Ho'okipa, Sprecks, Kanaha, and the north shore run.",
    nwsPoint: { latitude: 20.931, longitude: -156.309 },
    marineZoneCode: "PHZ117",
  },
  {
    id: "south-shore-kihei-maalaea",
    name: "South Shore / Kihei / Maalaea",
    shortName: "Kihei",
    description: "Kihei, Wailea, Maalaea Bay, and south shore launch zones.",
    nwsPoint: { latitude: 20.76, longitude: -156.457 },
    marineZoneCode: "PHZ118",
  },
  {
    id: "west-maui",
    name: "West Maui",
    shortName: "West Maui",
    description: "Lahaina side, Kaanapali, Honolua, and west side lee pockets.",
    nwsPoint: { latitude: 20.882, longitude: -156.683 },
    marineZoneCode: "PHZ118",
  },
  {
    id: "windward-hana",
    name: "Windward/Hana",
    shortName: "Hana",
    description: "Hana, windward squalls, and exposed east Maui waters.",
    nwsPoint: { latitude: 20.758, longitude: -155.988 },
    marineZoneCode: "PHZ117",
  },
  {
    id: "channels",
    name: "Channels",
    shortName: "Channels",
    description: "Pailolo, Alenuihaha, and inter-island acceleration zones.",
    nwsPoint: { latitude: 20.891, longitude: -156.512 },
    marineZoneCode: "PHZ119",
  },
  {
    id: "maui-county-windward-waters",
    name: "Maui County Windward Waters",
    shortName: "Windward waters",
    description: "NOAA windward coastal waters around Maui County.",
    nwsPoint: { latitude: 20.9, longitude: -156.1 },
    marineZoneCode: "PHZ117",
  },
  {
    id: "maui-county-leeward-waters",
    name: "Maui County Leeward Waters",
    shortName: "Leeward waters",
    description: "NOAA leeward coastal waters around Maui County.",
    nwsPoint: { latitude: 20.75, longitude: -156.55 },
    marineZoneCode: "PHZ118",
  },
];

export function getZone(id: ForecastZone["id"]) {
  return mauiZones.find((zone) => zone.id === id);
}
