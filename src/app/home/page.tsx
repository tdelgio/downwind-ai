import { OceanAppShell } from "@/components/ocean/shell";
import { HomeForecastOverview, normalizeZone } from "@/components/ocean/activity-forecast";
import { getOceanIntelligence } from "@/lib/ocean";

export default async function HomeModePage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string | string[] }>;
}) {
  const { snapshot } = await getOceanIntelligence();
  const selectedZone = normalizeZone((await searchParams).zone);

  return (
    <OceanAppShell active="/home" marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <HomeForecastOverview snapshot={snapshot} selectedZone={selectedZone} />
    </OceanAppShell>
  );
}
