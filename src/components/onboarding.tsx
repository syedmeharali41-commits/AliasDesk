"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Eye, EyeOff, Fingerprint, Globe, KeyRound, Loader2,
  Lock, MousePointerClick, Route, ShieldCheck, Sparkles, TriangleAlert, Zap,
  BookOpen, Info, AtSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cfApi, mapZone } from "@/lib/cf-client";
import type { Zone } from "@/lib/types";
import { cn } from "@/lib/utils";
import Guide from "@/components/views/guide";

/* ============================================================
 * Onboarding — 4 unified steps: Intro → Guide → Token → Zone
 * Full-width Obsidian aesthetic across all steps.
 * ============================================================ */

const FEATURES = [
  { icon: Route, title: "Alias Workspace", text: "Create, search, tag, pin and note every routing rule your domain owns." },
  { icon: MousePointerClick, title: "Quick-Copy Palette", text: "Press Ctrl+K anywhere, type two characters, clipboard done." },
  { icon: ShieldCheck, title: "Token Stays Yours", text: "Sent only to our server proxy — never embedded in the page, never logged." },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [guideStartStep, setGuideStartStep] = useState(0);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<{ kind: string; message: string } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const connectLive = useApp((s) => s.connectLive);
  const setActiveZone = useApp((s) => s.setActiveZone);

  const tokenLooksValid = token.trim().length >= 32;

  async function verify() {
    setError(null);
    setVerifying(true);
    const res = await cfApi.zones(token.trim());
    setVerifying(false);
    if (!res.ok) {
      setError(res.err ?? { kind: "unknown", message: "Unexpected error" });
      return;
    }
    const mapped = ((res.data ?? []) as never[]).map((z) => mapZone(z as never));
    const active = mapped.filter((z) => z.status === "active");
    if (mapped.length === 0) {
      setError({ kind: "empty", message: "Token verified, but no zones are visible to it. Add the Zone → Zone → Read permission and retry." });
      return;
    }
    setZones(active.length ? active : mapped);
    setStep(3);
  }

  function finishLive() {
    if (!picked) return;
    connectLive(token.trim(), zones);
    setActiveZone(picked);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-9 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] space-y-7">
        
        {/* ---------- TOP HEADER: BRAND + STEP RAIL ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <BrandMark />

          {/* Stepper Dots / Pill */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 shadow-sm">
            {["Intro", "Guide", "Token", "Zone"].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (i <= step || (i === 1 && step === 0) || (i === 2 && step === 1)) {
                    if (i === 1 && step !== 1) setGuideStartStep(0);
                    setStep(i);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-all rounded-full cursor-pointer",
                  i === step
                    ? "px-2.5 py-0.5 bg-accent text-black font-extrabold text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : i < step
                    ? "h-2.5 w-2.5 bg-emerald-400"
                    : "h-2.5 w-2.5 bg-white/20 hover:bg-white/40"
                )}
                title={`Step ${i + 1}: ${label}`}
              >
                {i === step && <span>{label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- ANIMATED STEP CONTENT ---------- */}
        <AnimatePresence mode="wait">
          {/* ============ STEP 0 — INTRO ============ */}
          {step === 0 && (
            <motion.div
              key="s0-intro"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Hero Title with Badge */}
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-accent shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Sparkles className="h-3 w-3" /> Next-Gen Cloudflare Email Routing
                </div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Architect Unlimited Inboxes. <span className="text-accent">Zero Cost. Zero Telemetry.</span>
                </h1>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
                  Transform any custom domain into a high-throughput alias engine with direct Cloudflare Email Routing, instant anti-detect isolation, and keyboard-first clipboard velocity.
                </p>
              </div>

              {/* Bento Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Bento Card 1 */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-3 hover:border-accent/40 transition group">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-105 transition shadow-sm">
                      <Route className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      Zero Cost
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Surgical Routing &amp; Catch-All</h3>
                    <p className="text-xs text-white/50 leading-relaxed mt-1">
                      Route infinite disposable or persistent inboxes to your personal email with zero server upkeep.
                    </p>
                  </div>
                </div>

                {/* Bento Card 2 */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-3 hover:border-accent/40 transition group">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-105 transition shadow-sm">
                      <AtSign className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      Unlimited
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Disposable &amp; Custom Aliases</h3>
                    <p className="text-xs text-white/50 leading-relaxed mt-1">
                      Generate infinite random disposable aliases for quick signups, or build permanent branded mailboxes (e.g. admin, support).
                    </p>
                  </div>
                </div>

                {/* Bento Card 3 */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-3 hover:border-accent/40 transition group">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition shadow-sm">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      100% Private
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Local-Only Security Vault</h3>
                    <p className="text-xs text-white/50 leading-relaxed mt-1">
                      Tokens are never stored externally or logged. Everything operates via direct local proxy.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-Step Setup Roadmap Bar */}
              <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Quick 3-Step Onboarding Roadmap
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                      1
                    </span>
                    <span>Connect Domain ($0.88–$1.99)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                      2
                    </span>
                    <span>Generate Cloudflare Token</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent font-semibold">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-black">
                      3
                    </span>
                    <span>Launch Workspace</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-white/50 hover:text-accent transition py-2 cursor-pointer order-2 sm:order-1 flex items-center gap-1.5"
                >
                  <span>Already configured? Enter API Token directly</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <Button
                  onClick={() => {
                    setGuideStartStep(0);
                    setStep(1);
                  }}
                  className="btn-accent h-11 px-7 text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] transition cursor-pointer order-1 sm:order-2 w-full sm:w-auto"
                >
                  <span>Start Step-by-Step Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============ STEP 1 — GUIDE ============ */}
          {step === 1 && (
            <motion.div
              key="s1-guide"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Guide
                initialStep={guideStartStep}
                maxSteps={guideStartStep === 0 ? 8 : undefined}
                onBackToIntro={() => setStep(guideStartStep === 0 ? 0 : 2)}
                onComplete={() => setStep(2)}
                onNavigate={() => setStep(2)}
              />
            </motion.div>
          )}

          {/* ============ STEP 2 — TOKEN (FULL WIDTH CONSISTENT) ============ */}
          {step === 2 && (
            <motion.div
              key="s2-token"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
                    Paste your Cloudflare API Token
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-white/60 leading-relaxed">
                    Verified inline against your zones before anything is stored.
                  </p>
                </div>

                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition cursor-pointer"
                >
                  <span>Create Token in Cloudflare</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>

              {/* Input Field Card */}
              <div className="rounded-xl border border-white/[0.08] bg-black/50 p-5 space-y-3">
                <label className="overline-label block">Cloudflare API Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    autoFocus
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && tokenLooksValid && !verifying && verify()}
                    placeholder="Paste your Cloudflare API token..."
                    spellCheck={false}
                    className="input-obsidian addr-mono w-full rounded-xl py-3 pl-10 pr-32 text-xs sm:text-sm tracking-wide bg-white/[0.03] border-white/10"
                  />
                  <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    {token && !verifying && (
                      <span className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                        tokenLooksValid
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.05] text-white/40"
                      )}>
                        {tokenLooksValid ? "SHAPE OK" : `${token.trim().length} chars`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="rounded p-1 text-white/40 hover:text-white transition cursor-pointer"
                      aria-label={showToken ? "Hide token" : "Show token"}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>



              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden rounded-xl border border-red-500/30 bg-red-500/[0.08] p-4"
                  role="alert"
                >
                  <p className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <TriangleAlert className="h-4 w-4" />
                    {error.kind === "network" ? "Network unreachable" : error.kind === "unauthorized" ? "Unauthorized token" : error.kind === "empty" ? "No visible zones" : "Verification failed"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">{error.message}</p>
                </motion.div>
              )}

              {/* Bottom Actions with Guide Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setGuideStartStep(8);
                    setStep(1);
                  }}
                  className="btn-ghosty h-11 px-4 text-xs sm:text-sm font-semibold text-white/70 hover:text-white gap-2 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-accent" />
                  <span>View Setup Guide</span>
                </Button>

                <Button
                  onClick={verify}
                  disabled={!tokenLooksValid || verifying}
                  className="btn-accent h-11 px-7 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying with Cloudflare…</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============ STEP 3 — ZONE ============ */}
          {step === 3 && (
            <motion.div
              key="s3-zone"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="h-4 w-4" /> Token verified — {zones.length} active zone{zones.length === 1 ? "" : "s"} discovered
                </p>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-white mt-1">
                  Pick your initial domain workspace
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-white/60 leading-relaxed">
                  You can seamlessly switch between domains anytime from Settings.
                </p>
              </div>

              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {zones.map((z, i) => (
                  <motion.button
                    key={z.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setPicked(z.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition cursor-pointer select-none",
                      picked === z.id
                        ? "border-accent bg-accent/[0.06] shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl border transition",
                        picked === z.id ? "border-accent/40 bg-accent/10 text-accent" : "border-white/10 bg-white/[0.03] text-white/50"
                      )}>
                        <Globe className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="addr-mono text-sm font-bold text-white">{z.name}</p>
                        <p className="text-[11px] text-white/40">Status: {z.status || "Active"}</p>
                      </div>
                    </div>
                    {picked === z.id && (
                      <span className="flex items-center gap-1 text-xs font-bold text-accent">
                        <Check className="h-4 w-4" /> Selected
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="btn-ghosty h-11 px-5 text-xs sm:text-sm cursor-pointer"
                >
                  Back to Token
                </Button>

                <Button
                  onClick={finishLive}
                  disabled={!picked}
                  className="btn-accent h-11 px-7 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
                >
                  <span>Launch AliasDesk Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("grid place-items-center rounded-xl border border-accent/40 bg-black overflow-hidden p-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]", compact ? "h-9 w-9" : "h-11 w-11")}>
        <img src="/logo.png" alt="AliasDesk" className="h-full w-full object-contain" />
      </span>
      <div>
        <p className="font-display text-lg font-bold tracking-tight text-white">
          Alias<span className="text-accent">Desk</span>
        </p>
      </div>
    </div>
  );
}
