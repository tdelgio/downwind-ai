import { ActivityForecastPage, normalizeShore } from "@/components/ocean/activity-forecast";
import { OceanAppShell } from "@/components/ocean/shell";
import { getOceanIntelligence } from "@/lib/ocean";

export default async function ShoresPage({
  searchParams,
}: {
  searchParams: Promise<{ shore?: string | string[] }>;
}) {
  const { snapshot } = await getOceanIntelligence();
  const selectedShore = normalizeShore((await searchParams).shore);

  return (
    <OceanAppShell active="/shores" oceanStatus={getOceanStatus(snapshot)} marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <ActivityForecastPage activity="shores" selectedZone="windward" selectedShore={selectedShore} snapshot={snapshot} />
    </OceanAppShell>
  );
}

function getOceanStatus(snapshot: Awaited<ReturnType<typeof getOceanIntelligence>>["snapshot"]) {
  const direction = snapshot.wind.directionCardinal ?? "Live";
  return `${direction} trades active`;
}
