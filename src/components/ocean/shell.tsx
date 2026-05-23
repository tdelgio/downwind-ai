import { Sidebar } from "@/components/ocean/sidebar";
import { TopNavigation } from "@/components/ocean/top-navigation";

export function OceanAppShell({
  active,
  children,
  oceanStatus = "Live Maui ocean state",
}: {
  active: string;
  children: React.ReactNode;
  oceanStatus?: string;
  marineAlertCount?: number;
  marineAlertHeadline?: string;
}) {
  return (
    <main className="ocean-shell relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_70%_10%,rgba(91,231,255,0.18),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.10),transparent_35%),linear-gradient(180deg,#F7FCFD_0%,#EDF8F7_100%)] text-[#102b3a]">
      <div className="ocean-texture-overlay pointer-events-none fixed inset-0" />
      <TopNavigation active={active} oceanStatus={oceanStatus} />
      <div className="relative flex min-h-screen">
        <Sidebar active={active} />
        <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</section>
      </div>
    </main>
  );
}
