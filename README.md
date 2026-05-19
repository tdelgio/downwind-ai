# Downwind AI

A real-time ocean intelligence platform for downwind and ocean athletes.

DEMO: https://downwindai.netlify.app/fishing

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product screens

- `/home` fast decision-making: ocean score, launch window, recommendation, current conditions, CTAs
- `/live` realtime awareness: wind, buoy, tide, harbor/camera placeholders, alerts, confidence
- `/routes` route planning: Maliko route visualization, wind assist, glide/re-entry sections, route quality
- `/forecast` detailed planning: forecast windows, wind, swell, tide, confidence, source freshness
- `/` redirects to `/home`

## Source list

- NWS API: `https://api.weather.gov` for points, hourly forecast, alerts, wind, rain, and clouds
- NOAA Coastal Waters Forecast: `https://forecast.weather.gov/product.php?issuedby=HFO&product=CWF&site=hfo`
- NOAA Marine Forecast Matrix: `https://www.weather.gov/hfo/MFM`
- NWS Honolulu Surf Zone Forecast: `https://forecast.weather.gov/product.php?issuedby=HFO&product=SRF&site=HFO`
- Hawaii Weather Today surfing report: `https://www.hawaiiweathertoday.com/surfing/`
- Windytron Maui wind/swell graphs: `https://windytron.com`
- NOAA CO-OPS tide predictions: Kahului station `1615680`
- NDBC buoy data: station `51205`, with the buoy module structured for more Hawaii stations
- NDBC / NOAA NOS station `KLIH1` / `1615680`: Kahului, Kahului Harbor, HI
- Offshore buoys: `51004`, `51WH0`
- South surf buoy: `51213` Kaumalapau Southwest, Lanai
- Harbor wind checks: Maalaea Harbor, Mala Ramp/Lahaina, Lahaina Harbor, Kahului Harbor/KLIH1
- PacIOOS currents: `https://www.pacioos.hawaii.edu/currents/model-hawaii/`
- Hawaii FADS:
  - `https://www.himb.hawaii.edu/FADS/`
  - `https://www.himb.hawaii.edu/FADS/Maps%20%26%20Loc/MauiFADS.html`
  - `https://www.himb.hawaii.edu/FADS/Maps%20%26%20Loc/MauiMap.html`

## Architecture

The first Ocean Intelligence data layer lives in `src/lib/ocean/`:

- `types.ts` normalized ocean intelligence types
- `ndbc.ts` NOAA NDBC buoy observation adapter
- `coops.ts` NOAA CO-OPS tide/current adapter
- `nws.ts` NOAA/NWS forecast and alerts adapter
- `scoring.ts` downwind route scoring and interpreted values
- `mock-data.ts` Maui route config and fallback data
- `index.ts` app-facing API

Legacy source adapters currently live in `src/lib/sources/` while the app migrates toward the Ocean Intelligence layer.

## Next steps

- Connect `/home`, `/live`, `/routes`, and `/forecast` to more route configs as they are added.
- Parse NOAA HFO CWF sections for windward, leeward, and channel marine zones.
- Parse or ingest NOAA Marine Forecast Matrix rows for seas and swell period.
- Replace mock NDBC 51205 observation with live realtime feed data.
- Replace mock Kahului tide predictions with NOAA CO-OPS station `1615680`.
- Parse the Maui section of NWS SRFHFO for north/west/south/east shore surf.
- Parse Hawaii Weather Today Maui surf spots and swell direction narrative.
- Parse Windytron Kanaha, Ho'okipa, and Kihei wind delta graph signals.
- Add the PacIOOS current layer as an ocean movement signal.
- Parse HIMB Maui FAD tables and map coordinates.
- Add real map rendering for Maui zones, FADs, buoy 51205, and current vectors.

## TODO

- Add route-level loading states.
- Add tests for source parsers and scoring thresholds.
- Add stale-data banners when a live source fails.
- Add more Hawaii buoys through `hawaiiBuoyStations`.
- Add user-editable thresholds for craft size, crew comfort, and preferred launch.
