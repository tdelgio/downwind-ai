import { Sidebar } from "@/components/ocean/sidebar";
import { TopNavigation } from "@/components/ocean/top-navigation";

export function OceanAppShell({
  active,
  children,
  marineAlertCount = 0,
  marineAlertHeadline,
}: {
  active: string;
  children: React.ReactNode;
  marineAlertCount?: number;
  marineAlertHeadline?: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_70%_10%,rgba(91,231,255,0.18),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.10),transparent_35%),linear-gradient(180deg,#F7FCFD_0%,#EDF8F7_100%)] text-[#102b3a]">
      <div className="ocean-texture-overlay pointer-events-none fixed inset-0" />
      <TopNavigation active={active} />
      <div className="relative z-20 border-b border-orange-800/10 bg-orange-50/75 px-4 py-2 text-sm backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={marineAlertCount ? "size-2 rounded-full bg-orange-600" : "size-2 rounded-full bg-slate-300"} />
            <span className="font-semibold text-orange-950">Marine alerts</span>
            <span className="text-orange-900/75">{marineAlertCount ? marineAlertHeadline ?? `${marineAlertCount} active` : "None active"}</span>
          </div>
          <span className="rounded-full border border-orange-800/15 bg-white/60 px-2 py-1 text-xs font-semibold text-orange-900">
            {marineAlertCount} active
          </span>
        </div>
      </div>
      <div className="relative flex min-h-screen">
        <Sidebar active={active} />
        <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</section>
      </div>
    </main>
  );
}
