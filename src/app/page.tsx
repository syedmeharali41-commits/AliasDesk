"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import Onboarding from "@/components/onboarding";
import AppShell from "@/components/app-shell";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const onboarded = useApp((s) => s.onboarded);
  const accent = useApp((s) => s.settings.accent);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* apply the accent theme globally */
  useEffect(() => {
    if (accent) {
      document.documentElement.setAttribute("data-accent", accent);
    }
  }, [accent]);

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <span className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl border border-accent/40 bg-black overflow-hidden p-2">
            <img src="/logo.png" alt="AliasDesk" className="h-full w-full object-contain" />
          </span>
          <p className="overline-label text-white/50">AliasDesk</p>
        </div>
      </div>
    );
  }

  return onboarded ? <AppShell /> : <Onboarding />;
}
