"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Youtube, Lightbulb, ArrowRight, ArrowLeft,
  Search, Mail, Sparkles, Check, CheckCircle2, ShieldCheck, Globe,
  Server, Zap, Inbox, KeyRound, BookOpen, Lock, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Guide({
  onNavigate,
  onBackToIntro,
  onComplete,
  initialStep = 0,
  maxSteps,
}: {
  onNavigate?: (view: any) => void;
  onBackToIntro?: () => void;
  onComplete?: () => void;
  initialStep?: number;
  maxSteps?: number;
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStep !== undefined) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  const steps = [
    {
      num: "00",
      title: "Purchase an Affordable Domain ($0.99 – $1.99)",
      tag: "Prerequisite",
    },
    {
      num: "01",
      title: "Connect Your Domain to Cloudflare",
      tag: "Nameservers",
    },
    {
      num: "02",
      title: "Navigate to Email Routing in Cloudflare",
      tag: "Cloudflare Search",
    },
    {
      num: "03",
      title: "Enable Email Routing & Click 'Onboard Domain'",
      tag: "Onboard Domain",
    },
    {
      num: "04",
      title: "Select Your Zone & Click 'Continue'",
      tag: "Zone Selection",
    },
    {
      num: "05",
      title: "Verify DNS Records & Click 'Activate'",
      tag: "DNS Activation",
    },
    {
      num: "06",
      title: "Click 'Destination Addresses' to Add Inbox",
      tag: "Destination Inbox",
    },
    {
      num: "07",
      title: "Enter Forwarding Email & Click 'Add address'",
      tag: "Add Inbox",
    },
    {
      num: "08",
      title: "Open API Tokens & Click '+ Create Token'",
      tag: "Create Token",
    },
    {
      num: "09",
      title: "Click 'Get started' on Create Custom Token",
      tag: "Custom Token",
    },
    {
      num: "10",
      title: "Set Permissions & Click 'Continue to summary'",
      tag: "Permissions",
    },
    {
      num: "11",
      title: "Copy Secret Token & Paste Into AliasDesk",
      tag: "Copy & Connect",
    },
  ];

  const isDomainGuide = maxSteps === 8 || (!!onBackToIntro && initialStep < 8);
  const isTokenGuide = !!onBackToIntro && initialStep >= 8;

  const visibleSteps = isDomainGuide
    ? steps.slice(0, 8)
    : isTokenGuide
    ? steps.slice(8)
    : steps;

  function goToStep(idx: number) {
    if (idx >= 0 && idx < steps.length) {
      setCurrentStep(idx);
      try {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    }
  }

  useEffect(() => {
    try {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }, [currentStep]);

  return (
    <div ref={topRef} className="max-w-4xl mx-auto space-y-6 pt-1 pb-12">
      {/* ---------- HEADER WITH SLEEK MINIMAL STEP DOTS ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="overline-label">SETUP GUIDE · STEP {steps[currentStep]?.num ?? "00"}</p>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            {steps[currentStep]?.title}
          </h1>
        </div>

        {/* Sleek Minimalist Dot Pagination */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#08080a] px-3 py-1.5 shadow-sm">
          {visibleSteps.map((s) => {
            const actualIdx = steps.findIndex((x) => x.num === s.num);
            const isActive = currentStep === actualIdx;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => goToStep(actualIdx)}
                title={`Go to Step ${s.num}: ${s.title}`}
                className={cn(
                  "flex items-center gap-1.5 transition-all cursor-pointer rounded-full",
                  isActive
                    ? "px-2.5 py-0.5 bg-accent text-black font-extrabold text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "h-2.5 w-2.5 bg-white/20 hover:bg-white/50"
                )}
              >
                {isActive && <span>Step {s.num}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- ANIMATED STEP CONTENT ---------- */}
      <AnimatePresence mode="wait">
        {/* STEP 00 */}
        {currentStep === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <p className="text-xs text-white/60 leading-relaxed">
              You do <b className="text-white">NOT</b> need an expensive <span className="addr-mono text-white font-bold">.com</span> domain ($12–$15/year). Cheap domain extensions work 100% identically for email routing and creating unlimited aliases.
            </p>

            <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="h-4 w-4" /> Recommended Cheap Extensions ($0.99 – $1.99 / yr)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Extensions like <b className="text-white addr-mono">.site</b>, <b className="text-white addr-mono">.xyz</b>, <b className="text-white addr-mono">.online</b>, <b className="text-white addr-mono">.tech</b>, or <b className="text-white addr-mono">.space</b> cost only <span className="text-accent font-bold">$0.99 to $1.99</span> for the first year.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="https://www.namecheap.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 hover:border-accent/40 transition group cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-accent transition">Namecheap</span>
                  <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-accent transition" />
                </div>
                <p className="text-[11px] text-accent font-semibold mt-1">.site / .xyz from $0.99</p>
                <p className="text-[10px] text-white/40 mt-0.5">Free WHOIS privacy included</p>
              </a>

              <a
                href="https://porkbun.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 hover:border-accent/40 transition group cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-accent transition">Porkbun</span>
                  <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-accent transition" />
                </div>
                <p className="text-[11px] text-accent font-semibold mt-1">.xyz / .top from $1.50</p>
                <p className="text-[10px] text-white/40 mt-0.5">Low renewal rates & free SSL</p>
              </a>

              <a
                href="https://www.spaceship.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 hover:border-accent/40 transition group cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-accent transition">Spaceship</span>
                  <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-accent transition" />
                </div>
                <p className="text-[11px] text-accent font-semibold mt-1">.site from $0.88</p>
                <p className="text-[10px] text-white/40 mt-0.5">Modern, instant DNS setup</p>
              </a>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              {onBackToIntro ? (
                <button
                  type="button"
                  onClick={onBackToIntro}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Intro</span>
                </button>
              ) : (
                <div className="text-xs text-white/40">
                  Step 00 of {steps.length.toString().padStart(2, "0")}
                </div>
              )}
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Connect Cloudflare</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 01 */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <p className="text-xs text-white/60 leading-relaxed">
              Link your custom domain (from Namecheap, GoDaddy, Hostinger, Porkbun, Spaceship, etc.) to Cloudflare to enable Email Routing.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Add Your Domain to Cloudflare</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Log in to your <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-accent hover:underline font-semibold inline-flex items-center gap-1">Cloudflare Dashboard <ExternalLink className="h-3 w-3 inline" /></a>, click on <b className="text-white">"Add a Site"</b>, enter your domain name (e.g. <span className="addr-mono text-accent">yourdomain.site</span>), and select the <b className="text-white">Free Plan</b>.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Update Nameservers at Your Domain Registrar</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Cloudflare will scan your existing DNS and provide you with <b className="text-white">2 Cloudflare Nameservers</b> (e.g. <span className="addr-mono text-white/85">drew.ns.cloudflare.com</span> & <span className="addr-mono text-white/85">kiki.ns.cloudflare.com</span>). Go to your domain registrar (where you purchased the domain, e.g. Namecheap, Spaceship, Porkbun) and replace the default nameservers with Cloudflare's assigned nameservers.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    3
                  </span>
                  <p className="text-sm font-bold text-white">Wait for DNS Propagation</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Once updated, click <b className="text-white">"Check Nameservers"</b> in Cloudflare. DNS changes usually take between <b className="text-white">2 to 15 minutes</b>. When active, Cloudflare will display a green status: <span className="text-emerald-400 font-semibold">"Great news! Cloudflare is now protecting your site."</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-accent/30 bg-accent/[0.04] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
              <div className="flex items-start sm:items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                  <Youtube className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Need a Visual Walkthrough?</p>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    There are hundreds of short 2-minute YouTube tutorials for every registrar.
                  </p>
                </div>
              </div>

              <a
                href="https://www.youtube.com/results?search_query=how+to+connect+domain+to+cloudflare"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent transition shrink-0 cursor-pointer"
              >
                <span>Watch YouTube Tutorials</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Email Routing Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 02 */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                Once your domain is active on Cloudflare, open your domain dashboard to navigate to the <b className="text-white">Email Routing</b> service.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Search for Email Routing in Cloudflare</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Inside your Cloudflare domain overview, press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-mono text-white border border-white/20">Ctrl + K</kbd> (or click the top search bar) and search for <span className="addr-mono text-accent font-bold">"email ro"</span> or <span className="addr-mono text-accent font-bold">"Email Routing"</span>.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Click "Email Service &gt; Email Routing"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click on <b className="text-white">Email Service &gt; Email Routing</b> from the search dropdown (or click <b className="text-white">Email</b> in the left sidebar navigation) to open the Email Routing management portal.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-accent" /> Cloudflare Quick Search Demonstration
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Ctrl + K
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-email-routing-search.png"
                  alt="Cloudflare Email Routing Search Walkthrough"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(3)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Onboard Domain</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 03 */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                When you land on the Email Routing introduction screen, you need to initiate domain onboarding to enable automated routing.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Click "+ Onboard Domain"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click the blue <b className="text-white">"+ Onboard Domain"</b> button in the center (or top right) of the page to begin configuring your domain's email delivery rules.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">What Email Routing Enables</p>
                </div>
                <ul className="text-xs text-white/60 pl-8.5 space-y-1.5 list-disc list-outside">
                  <li><b className="text-white">Private by Design:</b> Cloudflare forwards incoming emails directly without storing email contents.</li>
                  <li><b className="text-white">Free &amp; Straightforward:</b> Create unlimited custom email aliases at zero cost.</li>
                  <li><b className="text-white">Delivered to Preferred Mailbox:</b> Seamlessly forward mail to Gmail, Outlook, ProtonMail, or any destination.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Cloudflare Email Routing Onboarding Screen
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Onboard Domain
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-onboard-domain.png"
                  alt="Cloudflare Email Routing Onboard Domain Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(4)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Select Zone</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 04 */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                Select your connected domain zone from the dropdown list and click continue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Select Your Domain Zone</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  In the <b className="text-white">Zone</b> dropdown, choose the domain you previously added to Cloudflare (e.g. <span className="addr-mono text-accent">scriptcore.site</span>).
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Click "Continue"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click the blue <b className="text-white">"Continue"</b> button at the bottom right to advance to the DNS records verification &amp; activation stage.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-accent" /> Cloudflare Zone Selection Screen
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Select Zone
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-select-zone-continue.png"
                  alt="Cloudflare Select Zone and Continue"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(5)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Activate DNS</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 05 */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                Review the automatically generated Cloudflare Email Routing DNS records and click <b className="text-white">Activate</b>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Review Generated MX &amp; SPF Records</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Cloudflare will automatically prepare the required <b className="text-white">MX records</b> (Mail Exchange servers) and <b className="text-white">SPF TXT record</b> (Sender Policy Framework) to enable instant incoming email reception.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Click "Activate"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click the blue <b className="text-white">"Activate"</b> button at the bottom right. Cloudflare will automatically inject these DNS records directly into your domain with 1-click.
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-accent" /> Cloudflare Verify DNS Records &amp; Activate
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Verify DNS Records
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-verify-dns-activate.png"
                  alt="Cloudflare Verify DNS Records and Activate"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(6)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Destination Addresses</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 06 */}
        {currentStep === 6 && (
          <motion.div
            key="step-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                After activating DNS records, return to the main Email Routing dashboard and open <b className="text-white">Destination Addresses</b>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Return to Email Routing Overview</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Notice your domain status now shows <span className="text-emerald-400 font-semibold">"Syncing"</span> or <span className="text-emerald-400 font-semibold">"Active"</span> with DNS records locked and ready.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Click "Destination Addresses"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click the <b className="text-white">"Destination Addresses"</b> button at the top right (next to "+ Onboard Domain") to add your personal inbox where all alias emails should be delivered (e.g. your personal Gmail or Outlook address).
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Inbox className="h-3.5 w-3.5 text-accent" /> Cloudflare Destination Addresses Button
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Destination Addresses
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-destination-addresses-click.png"
                  alt="Cloudflare Email Routing Click Destination Addresses"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(7)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Add Destination Inbox</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 07 */}
        {currentStep === 7 && (
          <motion.div
            key="step-7"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <p className="text-xs text-white/70 leading-relaxed">
                Add the destination email address where all your alias emails will be forwarded.
              </p>
            </div>

            {/* Warning Pro-Tip Callout */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="h-4 w-4" /> Crucial Tip: Do NOT Use Your Primary Personal Email
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                When testing, creating accounts, or managing multiple aliases, you will <b className="text-white">receive a high volume of emails</b>. If you use your primary personal Gmail, your main inbox can get flooded. We strongly recommend using a <b className="text-white">secondary or dedicated Gmail/Outlook address</b>!
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm font-bold text-white">Enter Your Destination Email</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Enter your dedicated forwarding email address (e.g. <span className="addr-mono text-accent">yourinbox@gmail.com</span>) in the text input at the bottom of the page.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm font-bold text-white">Click "Add address"</p>
                </div>
                <p className="text-xs text-white/60 pl-8.5 leading-relaxed">
                  Click the blue <b className="text-white">"Add address"</b> button. Cloudflare will automatically send a verification email with a confirmation link to that inbox.
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent" /> Cloudflare Add Destination Address Form
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Add address
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-add-destination-address.png"
                  alt="Cloudflare Add Destination Address Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(6)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              {isDomainGuide ? (
                <button
                  type="button"
                  onClick={() => (onComplete ? onComplete() : onNavigate?.("token"))}
                  className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
                >
                  <span>Next: Connect API Token</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(8)}
                  className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
                >
                  <span>Next: Create API Token</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 08 — CLICK CREATE TOKEN */}
        {currentStep === 8 && (
          <motion.div
            key="step-08"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-6"
          >
            {/* Quick Action Link to Cloudflare API Tokens */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/[0.06] p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-accent flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Cloudflare API Tokens Page
                </p>
                <p className="text-sm font-bold text-white mt-1">
                  Open Cloudflare User API Tokens
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  Direct link: <span className="addr-mono text-accent">https://dash.cloudflare.com/profile/api-tokens</span>
                </p>
              </div>

              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="btn-accent inline-flex h-11 items-center gap-2.5 rounded-xl px-6 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition cursor-pointer whitespace-nowrap"
              >
                <span>Open API Tokens Page</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    1
                  </span>
                  <span className="text-sm font-bold text-white">
                    Click the &ldquo;+ Create Token&rdquo; Button
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  On the <b className="text-white">User API Tokens</b> dashboard, look at the top-right corner and click the blue <b className="text-accent">&ldquo;+ Create Token&rdquo;</b> button.
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-accent" /> Cloudflare User API Tokens Header
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  + Create Token
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-create-token-click.png"
                  alt="Cloudflare Create Token Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => (isTokenGuide && onBackToIntro ? onBackToIntro() : goToStep(7))}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{isTokenGuide ? "Back to Token Input" : "Previous Step"}</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(9)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Custom Token</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 09 — CLICK GET STARTED ON CUSTOM TOKEN */}
        {currentStep === 9 && (
          <motion.div
            key="step-09"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-6"
          >
            {/* Step Highlights */}
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    1
                  </span>
                  <span className="text-sm font-bold text-white">
                    Find the &ldquo;Custom token&rdquo; Section
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  On the <b className="text-white">Create API Token</b> page, look at the top section labeled <b className="text-white">Custom token</b> (&ldquo;Create a custom API token by configuring your permissions and token settings by hand&rdquo;).
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    2
                  </span>
                  <span className="text-sm font-bold text-white">
                    Click &ldquo;Get started&rdquo;
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Click the blue <b className="text-accent">&ldquo;Get started&rdquo;</b> button next to <b className="text-white">Create Custom Token</b> to open the custom token permissions form.
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent" /> Cloudflare Create Custom Token Option
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Get started
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-custom-token-get-started.png"
                  alt="Cloudflare Custom Token Get Started Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(8)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(10)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Set Permissions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 10 — CONFIGURE PERMISSIONS & CONTINUE TO SUMMARY */}
        {currentStep === 10 && (
          <motion.div
            key="step-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-6"
          >
            {/* Step Highlights */}
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    1
                  </span>
                  <span className="text-sm font-bold text-white">
                    Enter Token Name
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Under <b className="text-white">Token name</b>, type <b className="text-accent">&ldquo;Alias Tool&rdquo;</b> (or <b className="text-white">&ldquo;AliasDesk Token&rdquo;</b>).
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    2
                  </span>
                  <span className="text-sm font-bold text-white">
                    Add Permissions &amp; Zone Resources
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Add the following permissions using the dropdown menus:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9 text-xs">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <span className="text-white font-semibold block">Zone &gt; Email Routing Rules</span>
                    <span className="text-accent font-bold text-[11px]">Edit</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <span className="text-white font-semibold block">Zone &gt; Zone</span>
                    <span className="text-accent font-bold text-[11px]">Read</span>
                  </div>
                </div>

                <p className="text-xs text-white/60 pl-9 leading-relaxed pt-1">
                  Under <b className="text-white">Zone Resources</b>, set <b className="text-white">Include &gt; All zones</b>.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    3
                  </span>
                  <span className="text-sm font-bold text-white">
                    Click &ldquo;Continue to summary&rdquo;
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Scroll down to the bottom and click the blue <b className="text-accent">&ldquo;Continue to summary&rdquo;</b> button.
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Cloudflare Create Custom Token Form
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Continue to summary
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-custom-token-permissions-summary.png"
                  alt="Cloudflare Custom Token Permissions and Summary Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(9)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(11)}
                className="btn-accent inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                <span>Next: Copy Token</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 11 — COPY TOKEN & PASTE INTO ALIASDESK */}
        {currentStep === 11 && (
          <motion.div
            key="step-11"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-6"
          >
            {/* Security Notice Box */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 sm:p-5 space-y-1.5 shadow-[0_0_25px_rgba(245,158,11,0.1)]">
              <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> One-Time Secret Key Warning
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Cloudflare will <b className="text-white">only display this token once</b> for security purposes. Make sure to copy it now before closing the tab!
              </p>
            </div>

            {/* Step Highlights */}
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    1
                  </span>
                  <span className="text-sm font-bold text-white">
                    Copy the Generated Secret Token
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Click the small <b className="text-white">copy icon</b> inside the token box on Cloudflare to copy your full API token to your clipboard.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black font-extrabold text-xs">
                    2
                  </span>
                  <span className="text-sm font-bold text-white">
                    Paste into AliasDesk &amp; Verify
                  </span>
                </div>
                <p className="text-xs text-white/60 pl-9 leading-relaxed">
                  Click the <b className="text-accent">&ldquo;Connect API Token&rdquo;</b> button below, paste your token into the field, and click <b className="text-white">&ldquo;Verify &amp; continue&rdquo;</b> to launch your live workspace!
                </p>
              </div>
            </div>

            {/* Screenshot Display Card */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-accent" /> Cloudflare API Token Successfully Created
                </span>
                <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Copy Token
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
                <img
                  src="/guide/cloudflare-copy-token-paste-tool.png"
                  alt="Cloudflare Copy API Token Screen"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => goToStep(10)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 text-xs font-semibold text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>

              {onComplete || onNavigate ? (
                <button
                  type="button"
                  onClick={() => (onComplete ? onComplete() : onNavigate?.("token"))}
                  className="btn-accent inline-flex h-11 items-center gap-2.5 rounded-xl px-7 text-xs sm:text-sm font-extrabold shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition cursor-pointer"
                >
                  <span>Connect API Token Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="text-xs text-white/40">
                  Step 11 of {steps.length.toString().padStart(2, "0")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
