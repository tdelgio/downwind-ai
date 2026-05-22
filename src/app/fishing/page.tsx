import { ActivityForecastPage, normalizeZone } from "@/components/ocean/activity-forecast";
import { OceanAppShell } from "@/components/ocean/shell";
import { getOceanIntelligence } from "@/lib/ocean";

export default async function FishingPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string | string[] }>;
}) {
  const { snapshot } = await getOceanIntelligence();
  const selectedZone = normalizeZone((await searchParams).zone);

  return (
    <OceanAppShell active="/fishing" marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <ActivityForecastPage activity="fishing" selectedZone={selectedZone} snapshot={snapshot} />
    </OceanAppShell>
  );
}
