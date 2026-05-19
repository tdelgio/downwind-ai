import { OceanAppShell } from "@/components/ocean/shell";
import { HomeForecastOverview } from "@/components/ocean/activity-forecast";
import { getOceanIntelligence } from "@/lib/ocean";

export default async function HomeModePage() {
  const { snapshot, score } = await getOceanIntelligence();

  return (
    <OceanAppShell active="/home" marineAlertCount={snapshot.alerts.length} marineAlertHeadline={snapshot.alerts[0]?.headline}>
      <HomeForecastOverview snapshot={snapshot} score={score} />
    </OceanAppShell>
  );
}
