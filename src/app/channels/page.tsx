import { ActivityForecastPage, normalizeZone } from "@/components/ocean/activity-forecast";
import { OceanAppShell } from "@/components/ocean/shell";
import { getOceanIntelligence } from "@/lib/ocean";

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string | string[] }>;
}) {
  const { snapshot } = await getOceanIntelligence();
  const selectedZone = normalizeZone((await searchParams).zone);

  return (
    <OceanAppShell active="/channels" oceanStatus={getOceanStatus(snapshot)} marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <ActivityForecastPage activity="channels" selectedZone={selectedZone} snapshot={snapshot} />
    </OceanAppShell>
  );
}

function getOceanStatus(snapshot: Awaited<ReturnType<typeof getOceanIntelligence>>["snapshot"]) {
  const direction = snapshot.wind.directionCardinal ?? "Live";
  return `${direction} trades active`;
}
