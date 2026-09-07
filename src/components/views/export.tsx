"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Braces, Download, Eye, FileText, Table, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, useActiveZone, metaOf } from "@/lib/store";
import { SectionHeader } from "@/components/kit";
import { buildExport, downloadContent, MIME } from "@/lib/helpers";
import { cn } from "@/lib/utils";

type Fmt = "txt" | "csv" | "json";

const FMT_META: Record<Fmt, { icon: typeof FileText; label: string; desc: string }> = {
  txt:  { icon: FileText, label: "TXT",  desc: "One address per line — paste into any form" },
  csv:  { icon: Table,    label: "CSV",  desc: "Address, target, enabled, tags, note · RFC 4180" },
  json: { icon: Braces,   label: "JSON", desc: "Mirrors the internal rule shape for round-tripping" },
};

export default function ExportView() {
  const zone = useActiveZone();
  const allRules = useApp((s) => s.rules);
  const activeZoneId = useApp((s) => s.activeZoneId);
  const rules = useMemo(
    () => allRules.filter((r) => r.zoneId === activeZoneId),
    [allRules, activeZoneId]
  );
  const aliasMeta = useApp((s) => s.aliasMeta);
  const log = useApp((s) => s.log);

  const [fmt, setFmt] = useState<Fmt>("csv");
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [withMeta, setWithMeta] = useState(true);

  const rows = useMemo(() => {
    return rules
      .filter((r) => (onlyEnabled ? r.enabled : true))
      .map((r) => ({ rule: r, meta: withMeta ? metaOf(aliasMeta, r.id) : { pinned: false, tags: [], note: "" } }));
  }, [rules, onlyEnabled, aliasMeta, withMeta]);

  const content = useMemo(
    () => (rows.length ? buildExport(rows, fmt) : ""),
    [rows, fmt]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `aliaskdesk-${zone?.name ?? "zone"}-${stamp}.${fmt}`;

  function save() {
    if (!rows.length) return;
    downloadContent(filename, content, MIME[fmt]);
    log({ kind: "export", message: `Exported ${rows.length} alias${rows.length === 1 ? "" : "es"} from ${zone?.name} as ${fmt.toUpperCase()}` });
    toast.success(`${filename} saved`, { description: `${rows.length} rows — what you saw is what the file contains.` });
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Export"
        title="Take your routing surface with you"
        sub="Export operates on the currently filtered alias set — what you see is what the file contains. In a desktop build this opens the native save dialog; here it downloads the file."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* options */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <p className="overline-label mb-3">Format</p>
            <div className="space-y-2">
              {(Object.keys(FMT_META) as Fmt[]).map((f) => {
                const m = FMT_META[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFmt(f)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition",
                      fmt === f ? "border-accent-soft bg-accent-soft" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <span className={cn("grid h-9 w-9 place-items-center rounded-lg", fmt === f ? "bg-accent text-black" : "bg-white/[0.04] text-white/50")}>
                      <m.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card space-y-3.5 p-5">
            <p className="overline-label">Scope</p>
            {[
              { k: "Active rules only", v: onlyEnabled, set: setOnlyEnabled, hint: `${rules.filter((r) => r.enabled).length} of ${rules.length} rules` },
              { k: "Include local metadata", v: withMeta, set: setWithMeta, hint: "tags + notes (local-only)" },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => o.set(!o.v)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-sm">{o.k}</p>
                  <p className="text-[11px] text-muted-foreground">{o.hint}</p>
                </div>
                <span className={cn(
                  "grid h-5 w-9 items-center rounded-full border px-0.5 transition",
                  o.v ? "border-accent bg-accent" : "border-white/20 bg-white/[0.04]"
                )}>
                  <span className={cn("h-3.5 w-3.5 rounded-full bg-black transition", o.v ? "translate-x-4 bg-black" : "translate-x-0 bg-white/50")} />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* preview */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-card flex min-h-80 flex-col p-0"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <p className="inline-flex items-center gap-2 text-xs text-white/50">
              <Eye className="h-3.5 w-3.5 text-accent" /> Live preview — first rows
            </p>
            <p className="tabular text-xs text-white/40">{rows.length} rows · {zone?.name}</p>
          </div>
          <pre className="addr-mono max-h-96 flex-1 overflow-auto whitespace-pre px-5 py-4 text-[12px] leading-relaxed text-white/70">
            {content ? content.slice(0, 4000) : "Nothing to preview — adjust the filters or create aliases first."}
            {content.length > 4000 ? "\n… preview truncated, full file on save" : ""}
          </pre>
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5">
            <p className="addr-mono truncate text-xs text-white/40">{filename}</p>
            <Button onClick={save} disabled={!rows.length} className="btn-accent h-9 gap-2 rounded-lg px-4 text-sm">
              <Download className="h-4 w-4" /> Save file
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
