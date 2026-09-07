"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AtSign, Globe, Inbox,
  LayoutDashboard, Menu, RefreshCw, Settings as SettingsIcon,
  Waypoints, X, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, useActiveZone } from "@/lib/store";
import { BrandMarkPart } from "@/components/brand";
import Dashboard from "@/components/views/dashboard";
import Aliases from "@/components/views/aliases";
import Destinations from "@/components/views/destinations";
import CatchAllDns from "@/components/views/catchall-dns";
import Settings from "@/components/views/settings";
import Guide from "@/components/views/guide";
import MandatorySetupGuide from "@/components/mandatory-setup-guide";
import { timeAgo } from "@/lib/helpers";
import { cfApi, mapRule, mapDestination } from "@/lib/cf-client";
import { cn } from "@/lib/utils";

export type ViewId =
  | "overview" | "aliases" | "destinations" | "catchall"
  | "settings" | "guide";

const NAV: { section: string; items: { id: ViewId; label: string; icon: typeof AtSign }[] }[] = [
  {
    section: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "aliases", label: "Aliases", icon: AtSign },
      { id: "destinations", label: "Destinations", icon: Inbox },
      { id: "catchall", label: "Catch-All & DNS", icon: Waypoints },
    ],
  },
  {
    section: "System",
    items: [
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "guide", label: "Guide", icon: BookOpen },
    ],
  },
];

export default function AppShell() {
  const [view, setView] = useState<ViewId>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const zone = useActiveZone();
  const zones = useApp((s) => s.zones);
  const connection = useApp((s) => s.connection);
  const onboarded = useApp((s) => s.onboarded);
  const lastSync = useApp((s) => s.lastSync);
  const rules = useApp((s) => s.rules);
  const setActiveZone = useApp((s) => s.setActiveZone);
  const ingestZoneData = useApp((s) => s.ingestZoneData);
  const markSynced = useApp((s) => s.markSynced);
  const enabledHere = rules.filter((r) => r.zoneId === zone?.id && r.enabled).length;

  async function sync() {
    if (!zone) {
      setView("aliases");
      return;
    }
    setSyncing(true);
    const token = useApp.getState().connection.token;
    const [rulesRes, destRes] = await Promise.all([
      cfApi.rules(token, zone.id),
      cfApi.destinations(token),
    ]);
    setSyncing(false);
    if (!rulesRes.ok) {
      toast.error("Sync failed", { description: rulesRes.err?.message });
      return;
    }
    ingestZoneData(zone.id, {
      rules: ((rulesRes.data ?? []) as never[]).map((r) => mapRule(r as never, zone.name, zone.id)),
      destinations: destRes.ok ? ((destRes.data ?? []) as never[]).map((d) => mapDestination(d as never)) : [],
      catchAll: useApp.getState().catchAll[zone.id] ?? { enabled: false, name: "Catch-all", actions: [{ type: "forward", value: [] }] },
      dns: useApp.getState().dns[zone.id] ?? [],
    });
    markSynced();
    toast.success(`${zone.name} synced`);
  }

  function navigate(v: ViewId) {
    setView(v);
    setMobileNav(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* ============ SIDEBAR (desktop) ============ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-white/[0.06] bg-[#070708]/90 backdrop-blur-xl lg:flex">
        <div className="p-5">
          <BrandMarkPart />
        </div>
        <nav id="tour-sidebar-nav" className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    id={`nav-${item.id}`}
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition",
                      view === item.id
                        ? "bg-white/[0.05] text-foreground"
                        : "text-white/50 hover:bg-white/[0.03] hover:text-white/85"
                    )}
                  >
                    {view === item.id && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <item.icon className={cn("h-4 w-4", view === item.id && "text-accent")} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ============ MOBILE NAV ============ */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileNav(false)}
          >
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="h-full w-64 border-r border-white/10 bg-[#070708] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandMarkPart />
                <button onClick={() => setMobileNav(false)} className="text-white/50" aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {NAV.map((group) => (
                <div key={group.section} className="mb-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{group.section}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                        view === item.id ? "bg-white/[0.05] text-foreground" : "text-white/50"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", view === item.id && "text-accent")} />
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ MAIN ============ */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
        {/* mobile header trigger */}
        <div className="flex items-center px-4 py-3 lg:hidden">
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/10" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* content column */}
        <main className="mx-auto w-full max-w-[1060px] flex-1 px-4 py-8 sm:px-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "overview" && <Dashboard onNavigate={navigate} />}
              {view === "aliases" && <Aliases />}
              {view === "destinations" && <Destinations />}
              {view === "catchall" && <CatchAllDns />}
              {view === "settings" && <Settings />}
              {view === "guide" && <Guide onNavigate={navigate} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* status bar — mono, active zone · routing state · last sync */}
        <footer className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1060px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 sm:px-7">
            <span className="addr-mono text-[11px] text-white/45">
              zone <span className="text-accent">{zone?.name ?? "—"}</span>
            </span>
            <span className="addr-mono text-[11px] text-white/45">
              routing <span className={enabledHere > 0 ? "text-[var(--success-c)]" : "text-[var(--warning-c)]"}>
                {enabledHere > 0 ? `${enabledHere} active` : "idle"}
              </span>
            </span>
            <span className="addr-mono hidden text-[11px] text-white/45 sm:inline">
              sync <span className="text-white/70">{lastSync ? timeAgo(lastSync) : "never"}</span>
            </span>
            <span className="addr-mono ml-auto hidden text-[11px] text-white/30 md:inline">
              api.cloudflare.com · v4
            </span>
          </div>
        </footer>
      </div>

      {/* Mandatory Onboarding Interactive Workflow Setup */}
      <MandatorySetupGuide currentView={view} onNavigate={navigate} />
    </div>
  );
}
