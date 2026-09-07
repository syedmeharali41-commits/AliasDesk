"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Globe, Check, ArrowRight, RefreshCw, Layers, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, useActiveZone } from "@/lib/store";
import { SectionHeader } from "@/components/kit";
import { cfApi, mapZone, mapRule, mapDestination, mapDns } from "@/lib/cf-client";
import { cn } from "@/lib/utils";

export default function Settings() {
  const zones = useApp((s) => s.zones);
  const activeZoneId = useApp((s) => s.activeZoneId);
  const setActiveZone = useApp((s) => s.setActiveZone);
  const ingestZoneData = useApp((s) => s.ingestZoneData);
  const markSynced = useApp((s) => s.markSynced);
  const rules = useApp((s) => s.rules);
  const zone = useActiveZone();

  const [syncing, setSyncing] = useState(false);

  function handleSwitch(selectedZoneId: string) {
    if (selectedZoneId === activeZoneId) return;
    const targetZone = zones.find((z) => z.id === selectedZoneId);
    if (!targetZone) return;

    setActiveZone(selectedZoneId);
    toast.success(`Switched active domain to ${targetZone.name}`);
  }

  async function refreshDomains() {
    setSyncing(true);
    const token = useApp.getState().connection.token;
    const res = await cfApi.zones(token);
    setSyncing(false);

    if (!res.ok) {
      toast.error("Failed to refresh domains", { description: res.err?.message });
      return;
    }

    const fetchedZones = ((res.data ?? []) as never[]).map((z) => mapZone(z as never));
    useApp.setState({ zones: fetchedZones });
    toast.success(`Refreshed ${fetchedZones.length} domains from Cloudflare`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader
        overline="Domain Management"
        title="Domain switcher"
        sub="Switch your active working domain across all connected Cloudflare zones."
        actions={
          <Button
            variant="ghost"
            onClick={refreshDomains}
            disabled={syncing}
            className="btn-ghosty h-9 gap-1.5 rounded-lg px-3 text-xs text-white/70 hover:text-white cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin text-accent")} />
            Refresh Domains
          </Button>
        }
      />

      {/* Domain List Grid */}
      <div className="space-y-3">
        {zones.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/50 text-sm">
            No domains discovered on this Cloudflare token.
          </div>
        ) : (
          zones.map((z, idx) => {
            const isActive = z.id === activeZoneId;
            const domainRulesCount = rules.filter((r) => r.zoneId === z.id || r.domain === z.name).length;

            return (
              <motion.div
                key={z.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                onClick={() => handleSwitch(z.id)}
                className={cn(
                  "glass-card group relative flex items-center justify-between p-4.5 rounded-xl border transition-all cursor-pointer select-none",
                  isActive
                    ? "border-accent/60 bg-accent/[0.04] shadow-[0_0_25px_rgba(245,158,11,0.12)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                {/* Active Indicator Strip */}
                {isActive && <span className="absolute inset-y-0 left-0 w-[3.5px] bg-accent rounded-l-xl" />}

                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition",
                    isActive
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/10 bg-white/[0.03] text-white/40 group-hover:text-white/70"
                  )}>
                    <Globe className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="addr-mono text-base font-bold text-white tracking-tight truncate">
                        {z.name}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          <Check className="h-3 w-3" /> Active Domain
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-white/40 uppercase">
                          {z.status || "Active"}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-white/45">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3 text-white/30" />
                        {domainRulesCount} {domainRulesCount === 1 ? "rule" : "rules"}
                      </span>
                      <span>·</span>
                      <span className="addr-mono text-[11px] text-white/35 truncate">
                        ID: {z.id.slice(0, 12)}…
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                    <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-accent pr-2">
                      <Sparkles className="h-4 w-4" /> Current
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitch(z.id);
                      }}
                      className="btn-ghosty group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white/60 transition cursor-pointer"
                    >
                      Switch to Domain <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. BROWSER PROFILES & TEMPORARY DATA CLEANER              */}
      {/* ========================================================= */}
      <div className="pt-6 border-t border-white/[0.08] space-y-4">
        <SectionHeader
          overline="Session Data"
          title="Anti-Detect Browser Profiles Cleaner"
          sub="Permanently wipe all isolated anti-detect browser profile folders, cookies, and cache from your disk."
        />

        <div className="glass-card p-5 rounded-xl border border-white/[0.08] bg-[#08080a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Local Anti-Detect Profile Storage
            </p>
            <p className="text-xs text-white/50 leading-relaxed max-w-lg">
              Deletes all temporary session directories in <span className="addr-mono text-white/70">%TEMP%/aliasdesk_profiles</span>. This cleans up disk space and ensures zero trace remains.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/browser", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "wipe_all_profiles" }),
                });
                const data = await res.json();
                if (data.ok) {
                  toast.success("Browser Profiles Wiped", { description: data.message });
                } else {
                  toast.error("Failed to wipe profiles", { description: data.error });
                }
              } catch (err: unknown) {
                toast.error("Error wiping profiles", { description: String(err) });
              }
            }}
            className="btn-ghosty flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white/80 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition cursor-pointer shrink-0"
          >
            <span>Wipe All Browser Profiles</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE SETUP WORKFLOW                              */}
      {/* ========================================================= */}
      <div className="pt-6 border-t border-white/[0.08] space-y-4">
        <SectionHeader
          overline="System Setup"
          title="Interactive Setup Workflow"
          sub="Re-launch the mandatory step-by-step setup guide for Destinations, Catch-All, and Aliases."
        />

        <div className="glass-card p-5 rounded-xl border border-white/[0.08] bg-[#08080a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Restart Setup Guide</p>
            <p className="text-xs text-white/50 leading-relaxed max-w-lg">
              Locks focus back into the guided setup flow until Destination, Catch-All, and your first Alias are configured.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("aliasdesk_mandatory_setup_completed");
              toast.success("Restarting Guided Setup...");
              setTimeout(() => window.location.reload(), 400);
            }}
            className="btn-accent flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition cursor-pointer shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Restart Setup Guide</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DANGER ZONE: CLOUDFLARE PROFILE & FACTORY RESET         */}
      {/* ========================================================= */}
      <div className="pt-6 border-t border-white/[0.08] space-y-4">
        <SectionHeader
          overline="Danger Zone"
          title="Profile & Account Management"
          sub="Disconnect your Cloudflare profile token or perform a full factory reset to wipe all saved data."
        />

        <div className="space-y-3">
          {/* Disconnect Profile Card */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.08] bg-[#08080a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Disconnect Cloudflare Account / Profile</p>
              <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                Removes your current Cloudflare API token and disconnects all {zones.length} active domain profiles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to disconnect your Cloudflare profile? You will need to re-enter your API token to use the tool.")) {
                  useApp.getState().disconnect();
                  toast.success("Cloudflare Profile Disconnected");
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-accent transition cursor-pointer shrink-0"
            >
              <span>Disconnect Profile</span>
            </button>
          </div>

          {/* Factory Reset Card */}
          <div className="glass-card p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-400">Factory Reset / Delete All Stored Profiles &amp; Data</p>
              <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                Permanently wipes all connected profiles, saved aliases, local tags, session metrics, and resets the tool to initial clean state.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm("⚠️ DANGER: This will permanently delete all profiles, cached domains, and reset all settings to zero. Are you sure you want to proceed?")) {
                  try {
                    await fetch("/api/browser", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "wipe_all_profiles" }),
                    });
                  } catch {}
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch {}
                  useApp.getState().resetAllData();
                  toast.success("Application Factory Reset Successfully");
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 px-4 py-2.5 text-xs font-bold text-red-300 transition cursor-pointer shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <span>Factory Reset Everything</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
