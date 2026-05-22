import Link from "next/link";
import { Home, Ship, Waves } from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ocean/theme-toggle";

const navItems = [
  { href: "/home", label: "Live", description: "Right now", icon: Home },

  {
    href: "/downwind",
    label: "Downwind",
    description: "Run read",
    icon: Waves,
  },
  { href: "/fishing", label: "Boats", description: "Channels", icon: Ship },
];

export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[rgba(9,76,96,0.08)] bg-white/[0.62] p-4 backdrop-blur-[22px] lg:block">
      <Link
        href="/home"
        className="flex items-center gap-3 rounded-2xl bg-[#f7fafa] p-3 ring-1 ring-[#e4e8ea]"
      >
        <span className="grid size-11 place-items-center rounded-full bg-white text-[#0d5968] ring-1 ring-[#d8e4e7]">
          <Waves className="size-5" />
        </span>
        <span>
          <span className="block text-base font-semibold tracking-[0.01em] text-[#102b3a]">
            Downwind AI
          </span>
          <span className="block text-xs font-medium uppercase tracking-[0.12em] text-[#6e8188]">
            Maui forecast
          </span>
        </span>
      </Link>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 transition",
              active === item.href
                ? "bg-[#102b3a] text-white"
                : "text-[#5f7078] hover:bg-[#f3f7f8] hover:text-[#102b3a]",
            )}
          >
            <item.icon className="size-5" />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                {item.href === "/home" ? (
                  <span className="live-pulse size-2 rounded-full bg-emerald-500" />
                ) : null}
                {item.label}
              </span>
              <span
                className={cn(
                  "block text-xs font-medium",
                  active === item.href ? "text-white/70" : "text-[#8b9ba2]",
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <ThemeToggle />
      </div>
    </aside>
  );
}

export { navItems };
