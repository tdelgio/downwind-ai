import { ExtendedForecastOverview, normalizeZone } from "@/components/ocean/activity-forecast";
import { OceanAppShell } from "@/components/ocean/shell";
import { getOceanIntelligence } from "@/lib/ocean";

export const revalidate = 300;

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string | string[] }>;
}) {
  const { snapshot } = await getOceanIntelligence();
  const selectedZone = normalizeZone((await searchParams).zone);

  return (
    <OceanAppShell active="/forecast" marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <ExtendedForecastOverview snapshot={snapshot} selectedZone={selectedZone} />
    </OceanAppShell>
  );
}
