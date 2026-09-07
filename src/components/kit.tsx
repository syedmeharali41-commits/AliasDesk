"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ================= CountUp ================= */
export function CountUp({
  value, duration = 1.4, className, suffix,
}: { value: number; duration?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ================= Section header ================= */
export function SectionHeader({
  overline, title, sub, actions,
}: { overline: string; title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 enter-anim">
      <div>
        <p className="overline-label mb-2 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {overline}
        </p>
        <h1 className="display-title text-3xl md:text-[2.4rem]">{title}</h1>
        {sub ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ================= Stat card ================= */
export function StatCard({
  label, value, hint, icon, tone = "accent", delay = 0,
  onClick,
}: {
  label: string; value: number | string; hint?: string;
  icon: React.ReactNode; tone?: "accent" | "success" | "danger" | "neutral";
  delay?: number; onClick?: () => void;
}) {
  const toneMap = {
    accent: "text-accent",
    success: "text-[var(--success-c)]",
    danger: "text-[var(--danger-c)]",
    neutral: "text-white/70",
  } as const;
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        "glass-card glass-card-hover group w-full p-5 text-left",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="overline-label">{label}</p>
        <span className={cn("opacity-70 transition group-hover:opacity-100", toneMap[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-3 font-display text-4xl font-bold tracking-tight">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </Comp>
  );
}

/* ================= Empty state ================= */
export function EmptyState({
  icon, title, sub, action,
}: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {sub ? <p className="max-w-sm text-sm text-muted-foreground">{sub}</p> : null}
      {action}
    </div>
  );
}

/* ================= Type-to-confirm dialog ================= */
export function ConfirmNameDialog({
  open, onOpenChange, objectName, kind, onConfirm, busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  objectName: string;
  kind: string;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const [typed, setTyped] = useState("");
  /* reset lives in the event handler, not an effect */
  function handleOpenChange(v: boolean) {
    if (!v) setTyped("");
    onOpenChange(v);
  }
  const valid = typed === objectName;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-white/10 bg-[#0b0b0c] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Delete {kind}</DialogTitle>
          <DialogDescription>
            This action writes through to Cloudflare and cannot be undone. Type{" "}
            <span className="addr-mono text-accent">{objectName}</span> to confirm.
          </DialogDescription>
        </DialogHeader>
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid && !busy) onConfirm();
          }}
          placeholder={objectName}
          spellCheck={false}
          className="input-obsidian addr-mono w-full rounded-md px-3.5 py-2.5 text-sm text-foreground placeholder:text-white/25"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {valid ? "Match confirmed." : "Exact name required — no bare OK buttons here."}
          </p>
          <Button
            disabled={!valid || busy}
            onClick={onConfirm}
            className="bg-[var(--danger-c)] font-semibold text-black hover:bg-[var(--danger-c)] hover:brightness-110"
          >
            Delete forever
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================= Copy button ================= */
export function CopyButton({
  text, className, label,
}: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [text]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(); }}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-accent-soft hover:text-accent",
        copied && "border-[var(--success-c)]/50 text-[var(--success-c)]",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ================= Tag chip ================= */
export function TagChip({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {tag}
      {onRemove ? (
        <button onClick={onRemove} className="ml-0.5 text-white/30 hover:text-[var(--danger-c)]" aria-label={`Remove tag ${tag}`}>
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

/* ================= Status dot ================= */
export function StatusDot({ ok, pulse }: { ok: boolean; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        ok ? (pulse ? "pulse-dot bg-[var(--success-c)]" : "bg-[var(--success-c)]") : "bg-[var(--warning-c)]"
      )}
    />
  );
}
