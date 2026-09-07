"use client";

import { cn } from "@/lib/utils";

export function BrandMarkPart() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/40 bg-black overflow-hidden p-1 accent-breathe">
        <img src="/logo.png" alt="AliasDesk" className="h-full w-full object-contain" />
      </span>
      <div>
        <p className="font-display text-[15px] font-bold leading-none tracking-tight">
          Alias<span className="text-accent">Desk</span>
        </p>
      </div>
    </div>
  );
}
