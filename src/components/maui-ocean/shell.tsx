import Link from "next/link";
import { Anchor, Fish, Waves, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/downwind", label: "Downwind", icon: Wind },
  { href: "/fishing", label: "Fishing", icon: Fish },
  { href: "/surf", label: "Surf", icon: Waves },
];

export function MauiOceanShell({ children, active }: { children: React.ReactNode; active: string }) {
  return (
    <main className="min-h-screen bg-[#f4efe5] text-[#08243a]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-24 pt-4 sm:px-8 lg:px-10">
        <header className="sticky top-0 z-20 -mx-5 border-b border-[#d8cdbd] bg-[#f4efe5]/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:-mx-10 lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#0d5f73] text-white shadow-sm">
                <Anchor className="size-5" />
              </span>
              <span>
                <span className="block text-base font-black tracking-tight">Maui Ocean Conditions</span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#667987]">Wind · swell · tide · safety</span>
              </span>
            </Link>
            <span className="hidden rounded-full bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0d5f73] ring-1 ring-[#d8cdbd] sm:inline-flex">
              Maui only
            </span>
          </div>
          <nav className="mt-5 grid grid-cols-3 gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 shrink-0 items-center justify-center gap-1 rounded-full border px-4 text-xs font-bold uppercase tracking-wide transition sm:text-sm",
                  active === item.href
                    ? "border-[#0b4c64] bg-[#0b4c64] text-white"
                    : "border-[#d8cdbd] bg-[#fffaf0] text-[#22465b] hover:border-[#0d5f73] hover:text-[#0b4c64]",
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 py-8">{children}</div>
      </div>
    </main>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[#ded3c2] bg-[#fffaf0] p-5 shadow-sm", className)}>{children}</section>;
}

export function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker ? <p className="text-xs font-black uppercase tracking-wide text-[#0d5f73]">{kicker}</p> : null}
      <h2 className="text-xl font-black tracking-tight text-[#08243a]">{title}</h2>
    </div>
  );
}
