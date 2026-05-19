import Link from "next/link";
import { Waves } from "lucide-react";

import { navItems } from "@/components/ocean/sidebar";
import { cn } from "@/lib/utils";

export function TopNavigation({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e4e8ea] bg-white/92 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/home" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-[#f3f7f8] text-[#0d5968] ring-1 ring-[#d8e4e7]">
            <Waves className="size-4" />
          </span>
          <span className="text-sm font-semibold text-[#102b3a]">Downwind AI</span>
        </Link>
        <span className="rounded-full bg-[#f7fafa] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7078] ring-1 ring-[#e4e8ea]">
          Maui
        </span>
      </div>
      <nav className="mt-3 grid grid-cols-4 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em]",
              active === item.href ? "bg-[#102b3a] text-white" : "bg-[#f3f7f8] text-[#5f7078]",
            )}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {item.href === "/home" ? <span className="live-pulse size-1.5 rounded-full bg-emerald-500" /> : null}
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
