"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AtSign, Rocket, Square, Flame, Loader2, ArrowUpRight
} from "lucide-react";
import { useApp, useActiveZone } from "@/lib/store";
import { useBrowserSessions, BrowserSession } from "@/lib/browser-session-store";
import { CountUp } from "@/components/kit";
import { timeAgo } from "@/lib/helpers";
import type { ViewId } from "@/components/app-shell";

/* ------------------------------------------------------------ */
/* Live Elapsed Stopwatch Timer Hook                            */
/* ------------------------------------------------------------ */
function useElapsedLive(startedAt: number) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    function tick() {
      const diffSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const mins = String(Math.floor(diffSec / 60)).padStart(2, "0");
      const secs = String(diffSec % 60).padStart(2, "0");
      setElapsed(`${mins}:${secs}`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

/* ------------------------------------------------------------ */
/* Active Sandbox Card                                          */
/* ------------------------------------------------------------ */
function ActiveSessionCard({
  session,
  onStop,
  onDestroy,
}: {
  session: BrowserSession;
  onStop: () => void;
  onDestroy: () => void;
}) {
  const elapsed = useElapsedLive(session.startedAt);
  const isBusy = session.status === "destroying";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/[0.04] p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <div className="min-w-0">
          <p className="addr-mono text-sm font-bold text-white truncate flex items-center gap-2">
            {session.alias}
            <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30">
              Running
            </span>
          </p>
          <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
            <span className="addr-mono font-medium text-white/80">PID: {session.pid}</span>
            <span>·</span>
            <span>{session.browserName}</span>
            <span>·</span>
            <span className="addr-mono font-bold text-accent">⏱️ {elapsed}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isBusy}
          onClick={onStop}
          title="Stop process"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/10 px-3 text-xs font-semibold text-white/90 transition active:scale-95 cursor-pointer"
        >
          <Square className="h-3 w-3 fill-white/60 text-white/60" />
          <span>Stop</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={onDestroy}
          title="Zero-Trace Wipeout: Kill process & permanently erase temporary profile"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 text-xs font-bold text-rose-300 transition active:scale-95 cursor-pointer shadow-sm"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-300" />
          ) : (
            <Flame className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span>{isBusy ? "Wiping…" : "Destroy & Wipe"}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Clean Minimal Overview Dashboard                             */
/* ------------------------------------------------------------ */
export default function Dashboard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const zone = useActiveZone();
  const allRules = useApp((s) => s.rules);
  const activeZoneId = useApp((s) => s.activeZoneId);
  const lastSync = useApp((s) => s.lastSync);
  const deleteRule = useApp((s) => s.deleteRule);

  // Browser sessions
  const sessions = useBrowserSessions((s) => s.sessions);
  const destroyedCount = useBrowserSessions((s) => s.destroyedCount || 0);
  const stopSession = useBrowserSessions((s) => s.stopSession);
  const destroySession = useBrowserSessions((s) => s.destroySession);

  const activeSessionsList = useMemo(() => {
    return Object.values(sessions).filter((s) => s && s.status !== "destroyed");
  }, [sessions]);

  // Current domain rules
  const domainRules = useMemo(
    () => allRules.filter((r) => r.zoneId === activeZoneId || r.domain === zone?.name || !r.zoneId),
    [allRules, activeZoneId, zone?.name]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-1">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div id="tour-domain-header" className="p-1 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="overline-label">OVERVIEW</p>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            {zone?.name ?? "Cloudflare Domain"}
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Active domain overview · Last synced {lastSync ? timeAgo(lastSync) : "just now"}
          </p>
        </div>

        <button
          id="tour-go-aliases"
          onClick={() => onNavigate("aliases")}
          className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
        >
          <AtSign className="h-4 w-4" /> Go to Aliases <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* ---------- 3 PRIMARY ESSENTIAL STAT BOXES ---------- */}
      <div id="tour-stats-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Aliases */}
        <div
          onClick={() => onNavigate("aliases")}
          className="rounded-2xl border border-white/10 bg-[#08080a] p-6 cursor-pointer hover:border-accent/60 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Total Aliases</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition">
              <AtSign className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-3">
            <CountUp value={domainRules.length} />
          </p>
          <p className="text-xs text-white/40 mt-1">
            Active rules on {zone?.name ?? "domain"}
          </p>
        </div>

        {/* 2. Active Sessions */}
        <div
          onClick={() => onNavigate("aliases")}
          className="rounded-2xl border border-white/10 bg-[#08080a] p-6 cursor-pointer hover:border-accent/60 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Active Sessions</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition">
              <Rocket className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-accent mt-3">
            <CountUp value={activeSessionsList.length} />
          </p>
          <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
            {activeSessionsList.length > 0 ? (
              <span className="text-accent font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                Live running now
              </span>
            ) : (
              "0 profiles running"
            )}
          </p>
        </div>

        {/* 3. Destroyed / Wiped */}
        <div className="rounded-2xl border border-white/10 bg-[#08080a] p-6 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Destroyed / Wiped</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-3">
            <CountUp value={destroyedCount} />
          </p>
          <p className="text-xs text-white/40 mt-1">
            Zero-trace profiles wiped from disk
          </p>
        </div>
      </div>

      {/* ---------- LIVE RUNNING SESSIONS (ONLY IF ACTIVE) ---------- */}
      {activeSessionsList.length > 0 && (
        <div className="rounded-2xl border border-accent/40 bg-[#08080a] p-5 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
          <div className="flex items-center justify-between">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              Live Active Working Sessions ({activeSessionsList.length})
            </p>
            <button
              onClick={() => onNavigate("aliases")}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              View in Aliases →
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {activeSessionsList.map((s) => (
              <ActiveSessionCard
                key={s.sessionId}
                session={s}
                onStop={() => stopSession(s.alias)}
                onDestroy={async () => {
                  await destroySession(s.alias);
                  const rule = domainRules.find((r) => r.address.toLowerCase() === s.alias.toLowerCase());
                  if (rule) deleteRule(rule.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
