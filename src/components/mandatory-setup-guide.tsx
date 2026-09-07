"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Waypoints, AtSign, CheckCircle2, BadgeCheck, Sparkles,
  ArrowRight, ShieldCheck, Mail, Zap, Lock
} from "lucide-react";
import { useApp, useActiveZone } from "@/lib/store";
import type { ViewId } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export default function MandatorySetupGuide({
  currentView,
  onNavigate,
}: {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  const zone = useActiveZone();
  const activeZoneId = useApp((s) => s.activeZoneId);
  const destinations = useApp((s) => s.destinations);
  const allRules = useApp((s) => s.rules);
  const catchAll = useApp((s) => s.catchAll[s.activeZoneId]);

  const [isDismissed, setIsDismissed] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Check storage on mount
  useEffect(() => {
    const done = localStorage.getItem("aliasdesk_mandatory_setup_completed");
    if (done !== "true") {
      setIsDismissed(false);
    }
  }, []);

  // Filter rules for active domain
  const domainRules = useMemo(() => {
    return allRules.filter(
      (r) => (r.zoneId === activeZoneId || r.domain === zone?.name || !r.zoneId) &&
             r.localPart && r.localPart.trim().length > 0 && r.address && !r.address.startsWith("@")
    );
  }, [allRules, activeZoneId, zone?.name]);

  const hasDestinations = destinations.length > 0;
  const hasVerifiedDestination = destinations.some((d) => d.verified);
  const isCatchAllEnabled = !!catchAll?.enabled;
  const hasCreatedAlias = domainRules.length > 0;

  // Determine current active workflow stage
  const currentStep = useMemo(() => {
    if (!hasDestinations) {
      if (currentView !== "destinations") return "nav-to-destinations";
      return "add-destination";
    }
    if (!hasVerifiedDestination) {
      if (currentView !== "destinations") return "nav-to-destinations";
      return "mark-verified";
    }
    if (!isCatchAllEnabled) {
      if (currentView !== "catchall") return "nav-to-catchall";
      return "toggle-catchall";
    }
    if (!hasCreatedAlias) {
      if (currentView !== "aliases") return "nav-to-aliases";
      return "create-alias";
    }
    return "completed";
  }, [hasDestinations, hasVerifiedDestination, isCatchAllEnabled, hasCreatedAlias, currentView]);

  // Handle completion trigger
  useEffect(() => {
    if (currentStep === "completed" && !isDismissed && !showCelebration) {
      setShowCelebration(true);
    }
  }, [currentStep, isDismissed, showCelebration]);

  // Track target element bounding rect & elevate element z-index
  useEffect(() => {
    if (isDismissed || showCelebration) {
      setTargetRect(null);
      setActiveTargetId(null);
      return;
    }

    let targetElementId: string | null = null;

    if (currentStep === "nav-to-destinations") targetElementId = "nav-destinations";
    else if (currentStep === "add-destination") {
      const modalInput = document.getElementById("input-destination-email");
      if (modalInput) targetElementId = "input-destination-email";
      else {
        const emptyBtn = document.getElementById("btn-add-destination-empty");
        targetElementId = emptyBtn ? "btn-add-destination-empty" : "btn-add-destination";
      }
    } else if (currentStep === "mark-verified") {
      targetElementId = "btn-mark-verified";
    } else if (currentStep === "nav-to-catchall") {
      targetElementId = "nav-catchall";
    } else if (currentStep === "toggle-catchall") {
      targetElementId = "switch-catchall";
    } else if (currentStep === "nav-to-aliases") {
      targetElementId = "nav-aliases";
    } else if (currentStep === "create-alias") {
      const modalInput = document.getElementById("input-alias-local");
      if (modalInput) targetElementId = "input-alias-local";
      else targetElementId = "btn-new-alias";
    }

    setActiveTargetId(targetElementId);

    let prevEl: HTMLElement | null = null;

    function updateRect() {
      if (!targetElementId) {
        setTargetRect(null);
        return;
      }
      const el = document.getElementById(targetElementId);
      if (el) {
        prevEl = el;
        el.style.position = "relative";
        el.style.zIndex = "10001";
        el.style.pointerEvents = "auto";

        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    }

    updateRect();
    const interval = setInterval(updateRect, 200);
    const handleResize = () => updateRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      clearInterval(interval);
      if (prevEl) {
        prevEl.style.zIndex = "";
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [currentStep, isDismissed, showCelebration]);

  function finishSetup() {
    localStorage.setItem("aliasdesk_mandatory_setup_completed", "true");
    setShowCelebration(false);
    setIsDismissed(true);
  }

  if (isDismissed) return null;

  // Instructions & Copy for each step (100% Professional English)
  let stepBadge = "STEP 1 OF 4";
  let stepIcon = Inbox;
  let stepTitle = "";
  let stepDesc = "";
  let placement: "bottom" | "top" | "left" | "right" | "center" = "bottom";

  if (currentStep === "nav-to-destinations") {
    stepBadge = "STEP 1 OF 4: DESTINATIONS";
    stepIcon = Inbox;
    stepTitle = "Open Destinations View 📬";
    stepDesc = "Click 'Destinations' in the left sidebar to configure your verified receiving mailbox.";
    placement = "right";
  } else if (currentStep === "add-destination") {
    stepBadge = "STEP 1 OF 4: ADD FORWARDING ADDRESS";
    stepIcon = Inbox;
    stepTitle = "Enter Your Destination Email ✉️";
    stepDesc = "Enter the destination email address (e.g. your personal Gmail) that you added to Cloudflare Destination Addresses.";
    placement = "bottom";
  } else if (currentStep === "mark-verified") {
    stepBadge = "STEP 2 OF 4: VERIFY DESTINATION";
    stepIcon = BadgeCheck;
    stepTitle = "Click 'Mark verified' ✅";
    stepDesc = "Click the 'Mark verified' button next to your destination email to make it active for routing rules.";
    placement = "top";
  } else if (currentStep === "nav-to-catchall") {
    stepBadge = "STEP 3 OF 4: CATCH-ALL & DNS";
    stepIcon = Waypoints;
    stepTitle = "Open Catch-All & DNS 🧭";
    stepDesc = "Click 'Catch-All & DNS' in the left sidebar to configure automatic domain email forwarding.";
    placement = "right";
  } else if (currentStep === "toggle-catchall") {
    stepBadge = "STEP 3 OF 4: ENABLE CATCH-ALL";
    stepIcon = Zap;
    stepTitle = "Enable Catch-All Routing ⚡";
    stepDesc = "Turn ON the Catch-all toggle switch so all unmatched incoming mail automatically forwards to your destination inbox.";
    placement = "bottom";
  } else if (currentStep === "nav-to-aliases") {
    stepBadge = "STEP 4 OF 4: ALIASES";
    stepIcon = AtSign;
    stepTitle = "Open Aliases Workspace ✉️";
    stepDesc = "Click 'Aliases' in the left sidebar to create and manage your forwarding aliases.";
    placement = "right";
  } else if (currentStep === "create-alias") {
    stepBadge = "STEP 4 OF 4: CREATE FIRST ALIAS";
    stepIcon = Sparkles;
    stepTitle = "Create Your First Forwarding Alias 🚀";
    stepDesc = "Click '+ New alias', choose your desired name (e.g. admin, support, billing), and click Create to complete setup!";
    placement = "bottom";
  }

  // Calculate Tooltip floating position
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 10003,
  };

  if (targetRect) {
    const pad = 14;
    if (placement === "right") {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, Math.min(window.innerHeight - 280, targetRect.top)),
        left: Math.min(window.innerWidth - 380, targetRect.left + targetRect.width + pad),
        zIndex: 10003,
      };
    } else if (placement === "top") {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, targetRect.top - 210),
        left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180)),
        zIndex: 10003,
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: Math.min(window.innerHeight - 230, targetRect.top + targetRect.height + pad),
        left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180)),
        zIndex: 10003,
      };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 10003,
    };
  }

  const Icon = stepIcon;

  function handleHitboxClick() {
    if (currentStep === "nav-to-destinations") {
      onNavigate("destinations");
    } else if (currentStep === "nav-to-catchall") {
      onNavigate("catchall");
    } else if (currentStep === "nav-to-aliases") {
      onNavigate("aliases");
    } else if (activeTargetId) {
      const el = document.getElementById(activeTargetId);
      if (el) {
        el.click();
        if (el instanceof HTMLInputElement) el.focus();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-none select-none">
      {/* ---------- SPOTLIGHT CUTOUT & BLOCKED BACKDROP ---------- */}
      {targetRect && !showCelebration ? (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-200 ease-out z-[9991]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(3, 3, 5, 0.88), 0 0 40px rgba(245, 158, 11, 0.65)",
            border: "2.5px solid rgba(245, 158, 11, 0.95)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md transition-all pointer-events-auto z-[9991]" />
      )}

      {/* ---------- 4-SIDED INVISIBLE CLICK BLOCKER ---------- */}
      {targetRect && !showCelebration && (
        <>
          {/* Top Blocker */}
          <div
            className="fixed inset-x-0 top-0 pointer-events-auto z-[9995] cursor-not-allowed"
            style={{ height: Math.max(0, targetRect.top - 6) }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          />
          {/* Bottom Blocker */}
          <div
            className="fixed inset-x-0 bottom-0 pointer-events-auto z-[9995] cursor-not-allowed"
            style={{ top: targetRect.top + targetRect.height + 6 }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          />
          {/* Left Blocker */}
          <div
            className="fixed left-0 pointer-events-auto z-[9995] cursor-not-allowed"
            style={{
              top: targetRect.top - 6,
              height: targetRect.height + 12,
              width: Math.max(0, targetRect.left - 6),
            }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          />
          {/* Right Blocker */}
          <div
            className="fixed right-0 pointer-events-auto z-[9995] cursor-not-allowed"
            style={{
              top: targetRect.top - 6,
              height: targetRect.height + 12,
              left: targetRect.left + targetRect.width + 6,
            }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          />
          {/* Direct Clickable Forwarder Hitbox over target */}
          <div
            className="fixed pointer-events-auto z-[10002] cursor-pointer"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            onClick={handleHitboxClick}
          />
        </>
      )}

      {/* ---------- CELEBRATION MODAL ON 100% COMPLETION ---------- */}
      {showCelebration ? (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[10010] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-accent/50 bg-[#0a0a0d] p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.3)] space-y-5"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <CheckCircle2 className="h-9 w-9 text-accent" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                Setup 100% Completed
              </span>
              <h2 className="font-display text-2xl font-extrabold text-white">
                Workspace Live &amp; Ready! 🚀
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                Your Destination inbox, Catch-All failover routing, and primary forwarding alias have been successfully configured.
              </p>
            </div>

            <button
              type="button"
              onClick={finishSetup}
              className="btn-accent h-12 w-full rounded-xl text-sm font-extrabold shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Live Workspace ✨</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      ) : (
        /* ---------- FLOATING INTERACTIVE INSTRUCTION CARD ---------- */
        <div style={tooltipStyle} className="w-[92vw] max-w-[370px] pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`mand-step-${currentStep}`}
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-accent/50 bg-[#0a0a0d]/95 p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-2xl space-y-3 cursor-pointer"
              onClick={handleHitboxClick}
            >
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Icon className="h-3.5 w-3.5" /> {stepBadge}
                </span>

                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400/80">
                  <Lock className="h-3 w-3" /> Mandatory Step
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  {stepTitle}
                </h3>
                <p className="text-xs text-white/75 leading-relaxed">
                  {stepDesc}
                </p>
              </div>

              {/* Action Pulse Indicator */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-accent font-semibold">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Click highlighted element to proceed
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-accent animate-pulse" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
