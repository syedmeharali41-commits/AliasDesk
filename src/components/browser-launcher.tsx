"use client";

import { useEffect, useState } from "react";
import {
  Rocket, Square, Loader2, Check, Settings2, Shield, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  useBrowserSessions, BrowserSession
} from "@/lib/browser-session-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ */
/* Live Elapsed Timer Hook                                      */
/* ------------------------------------------------------------ */
function useElapsedTime(startedAt: number) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    function update() {
      const diffSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const mins = String(Math.floor(diffSec / 60)).padStart(2, "0");
      const secs = String(diffSec % 60).padStart(2, "0");
      setElapsed(`${mins}:${secs}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

/* ------------------------------------------------------------ */
/* Clean Minimal Active Session HUD (Stop & Destroy)           */
/* ------------------------------------------------------------ */
function ActiveSessionHUD({
  session,
  onStop,
  onDestroy,
}: {
  session: BrowserSession;
  onStop: () => void;
  onDestroy: () => void;
}) {
  const elapsed = useElapsedTime(session.startedAt);
  const isBusy = session.status === "destroying";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-1 shadow-sm">
      {/* Timer & Status */}
      <div className="flex items-center gap-1.5 px-2 py-0.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="addr-mono text-xs font-semibold text-emerald-300">
          {elapsed}
        </span>
      </div>

      {/* Stop Button (Process Kill) */}
      <button
        type="button"
        disabled={isBusy}
        onClick={(e) => {
          e.stopPropagation();
          onStop();
        }}
        title="Stop browser process"
        className="flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/10 px-2 text-xs font-semibold text-white/80 transition active:scale-95 cursor-pointer"
      >
        <Square className="h-3 w-3 fill-white/60 text-white/60" />
        <span>Stop</span>
      </button>

      {/* Destroy Button (Kill + Zero-Trace Disk Wipe) */}
      <button
        type="button"
        disabled={isBusy}
        onClick={(e) => {
          e.stopPropagation();
          onDestroy();
        }}
        title="Zero-Trace Wipeout: Terminate process & permanently erase temporary profile from disk"
        className="flex h-7 items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-2 text-xs font-bold text-rose-300 transition active:scale-95 cursor-pointer"
      >
        {isBusy ? (
          <Loader2 className="h-3 w-3 animate-spin text-rose-300" />
        ) : (
          <Flame className="h-3 w-3 text-rose-400" />
        )}
        <span>{isBusy ? "Wiping…" : "Destroy"}</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Launch Isolated Profile Modal                                */
/* ------------------------------------------------------------ */
export function LaunchBrowserDialog({
  open,
  onOpenChange,
  alias,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alias: string;
}) {
  const detectedBrowsers = useBrowserSessions((s) => s.detectedBrowsers);
  const defaultBrowser = useBrowserSessions((s) => s.defaultBrowser);
  const fetchDetectedBrowsers = useBrowserSessions((s) => s.fetchDetectedBrowsers);
  const launchSession = useBrowserSessions((s) => s.launchSession);

  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "msedge" | "brave">(defaultBrowser);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDetectedBrowsers();
      setSelectedBrowser(defaultBrowser);
    }
  }, [open, defaultBrowser, fetchDetectedBrowsers]);

  async function handleLaunch() {
    setBusy(true);
    const session = await launchSession(alias, {
      browserType: selectedBrowser,
    });
    setBusy(false);
    if (session) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl sm:max-w-[440px] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        <DialogHeader className="pb-1 pr-8">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Launch Isolated Profile
              </DialogTitle>
              <DialogDescription className="addr-mono text-xs text-accent font-semibold pt-0.5">
                {alias}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Target Browser Selection */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2 block">
              Select Browser
            </label>
            <div className="grid grid-cols-3 gap-2">
              {detectedBrowsers.map((b) => {
                const active = selectedBrowser === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!b.found}
                    onClick={() => setSelectedBrowser(b.id)}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer relative",
                      active
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : b.found
                        ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        : "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className="text-xs font-bold text-white truncate">{b.name.replace(" Browser", "")}</span>
                      {active && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                    </div>
                    <span className="text-[10px] text-white/40">
                      {b.found ? "Installed" : "Not found"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sandboxing Notice */}
          <div className="rounded-xl border border-white/[0.06] bg-[#08080a] p-2.5 text-[11px] text-white/50 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Spawns isolated sandbox in <b>%TEMP%/aliasdesk_profiles</b></span>
          </div>

          {/* Launch Button */}
          <Button
            onClick={handleLaunch}
            disabled={busy}
            className="btn-accent h-10 w-full text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Launching…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" /> Launch Profile
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------ */
/* Clean Row Embedded Action Component                          */
/* ------------------------------------------------------------ */
export function AliasBrowserControl({
  alias,
  onDestroyAlias,
}: {
  alias: string;
  onDestroyAlias?: () => void;
}) {
  const key = alias.toLowerCase().trim();
  const session = useBrowserSessions((s) => s.sessions[key]);
  const stopSession = useBrowserSessions((s) => s.stopSession);
  const destroySession = useBrowserSessions((s) => s.destroySession);
  const launchSession = useBrowserSessions((s) => s.launchSession);
  const [modalOpen, setModalOpen] = useState(false);
  const [directLaunching, setDirectLaunching] = useState(false);

  async function handleDestroy() {
    await destroySession(alias);
    if (onDestroyAlias) {
      onDestroyAlias();
    }
  }

  // Quick 1-Click Direct Launch
  async function handleDirectLaunch(e: React.MouseEvent) {
    e.stopPropagation();
    setDirectLaunching(true);
    await launchSession(alias);
    setDirectLaunching(false);
  }

  if (session && session.status !== "destroyed") {
    return (
      <ActiveSessionHUD
        session={session}
        onStop={() => stopSession(alias)}
        onDestroy={handleDestroy}
      />
    );
  }

  return (
    <>
      <div className="flex items-center rounded-lg border border-accent/25 bg-accent/[0.05] p-0.5">
        <button
          type="button"
          onClick={handleDirectLaunch}
          disabled={directLaunching}
          title="1-Click Launch Isolated Browser Profile"
          className="flex h-7 items-center gap-1.5 px-2.5 text-xs font-semibold text-accent hover:text-accent-foreground hover:bg-accent/20 rounded-md transition cursor-pointer"
        >
          {directLaunching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Rocket className="h-3 w-3 text-accent" />
          )}
          <span>Launch</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          title="Browser profile options (WARP Proxy / Browser selection)"
          className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] rounded-md transition cursor-pointer"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <LaunchBrowserDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        alias={alias}
      />
    </>
  );
}
