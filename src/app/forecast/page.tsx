import { ExtendedForecastOverview } from "@/components/ocean/activity-forecast";
import { OceanAppShell } from "@/components/ocean/shell";
import { getOceanIntelligence } from "@/lib/ocean";

export const revalidate = 300;

export default async function ForecastPage() {
  const { snapshot } = await getOceanIntelligence();

  return (
    <OceanAppShell active="/forecast" marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <ExtendedForecastOverview snapshot={snapshot} />
    </OceanAppShell>
  );
}
