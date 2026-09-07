"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AtSign, ArrowUpDown, Download, Globe, Link2, LogOut,
  Pin, Plus, Power, Route, ScrollText, Tag, Trash2, TriangleAlert, Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { EmptyState, SectionHeader } from "@/components/kit";
import { timeAgo, formatDateTime } from "@/lib/helpers";
import type { ActivityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_META: Record<ActivityKind, { icon: typeof AtSign; tint: string; label: string }> = {
  connect:    { icon: Link2,        tint: "text-[var(--success-c)]", label: "Connection" },
  disconnect: { icon: LogOut,       tint: "text-white/50", label: "Connection" },
  create:     { icon: Plus,         tint: "text-accent", label: "Create" },
  delete:     { icon: Trash2,       tint: "text-[var(--danger-c)]", label: "Delete" },
  enable:     { icon: Power,        tint: "text-[var(--success-c)]", label: "Toggle" },
  disable:    { icon: Power,        tint: "text-white/45", label: "Toggle" },
  pin:        { icon: Pin,          tint: "text-accent", label: "Pin" },
  update:     { icon: ArrowUpDown,  tint: "text-accent", label: "Update" },
  export:     { icon: Download,     tint: "text-[var(--warning-c)]", label: "Export" },
  zone:       { icon: Globe,        tint: "text-accent", label: "Zone" },
  destination:{ icon: AtSign,       tint: "text-accent", label: "Destination" },
  catchall:   { icon: Waypoints,    tint: "text-[var(--warning-c)]", label: "Catch-all" },
  clear:      { icon: Trash2,       tint: "text-[var(--danger-c)]", label: "Journal" },
};

export default function Journal() {
  const journal = useApp((s) => s.journal);
  const clearJournal = useApp((s) => s.clearJournal);
  const [filter, setFilter] = useState<"all" | "writes" | "connection">("all");

  const visible = journal.filter((e) => {
    if (filter === "writes") return ["create", "delete", "enable", "disable", "update", "catchall", "destination"].includes(e.kind);
    if (filter === "connection") return ["connect", "disconnect", "zone"].includes(e.kind);
    return true;
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Activity journal"
        title="Your private, local timeline"
        sub="Every action performed through this app, append-only and stored on this device only — safe to show in screenshots during support conversations. Nothing is ever transmitted."
        actions={
          journal.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => { if (window.confirm("Clear the entire journal? This is deliberate and confirmed — entries cannot be recovered.")) { clearJournal(); } }}
              className="h-10 gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/60 hover:bg-[var(--danger-c)]/10 hover:text-[var(--danger-c)]"
            >
              <Trash2 className="h-4 w-4" /> Clear journal
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 w-fit">
        {([["all", "Everything"], ["writes", "Rule writes"], ["connection", "Connections"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-medium transition",
              filter === k ? "bg-accent text-black" : "text-white/55 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title="The journal is empty"
          sub="Connections, creates, deletes, toggles and exports will be recorded here with their kind and relative time."
        />
      ) : (
        <div className="relative">
          <div className="absolute bottom-4 left-[27px] top-4 w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent" aria-hidden />
          <div className="space-y-2">
            {visible.map((e, i) => {
              const meta = KIND_META[e.kind];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                  className="glass-card relative flex items-center gap-4 py-3 pl-3 pr-5"
                >
                  <span className={cn("relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#0a0a0b]", meta.tint)}>
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-white/85">{e.message}</p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {meta.label} · {formatDateTime(e.at)} · {timeAgo(e.at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
