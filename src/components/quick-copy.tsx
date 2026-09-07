"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CornerDownLeft, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================
 * Quick Copy palette — Ctrl/Cmd+K anywhere. Typeahead over
 * alias addresses, Enter copies with a flourish.
 * ============================================================ */

export function useQuickCopyHotkey(open: (v: boolean) => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

export default function QuickCopy({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  /* PaletteInner mounts fresh on every open (AnimatePresence unmounts it
   * on close), so query/copy state always starts clean — no reset effect. */
  return (
    <AnimatePresence>
      {open && <PaletteInner onOpenChange={onOpenChange} />}
    </AnimatePresence>
  );
}

function PaletteInner({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const rules = useApp((s) => s.rules);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rules.filter((r) => r.address.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      : rules;
    return list.slice(0, 8);
  }, [rules, query]);

  async function copy(id: string, address: string) {
    try {
      await navigator.clipboard.writeText(address);
    } catch { /* clipboard unavailable */ }
    setCopiedId(id);
    setTimeout(() => onOpenChange(false), 650);
  }

  function go() {
    onOpenChange(false);
    router.push("/?view=aliases");
    window.dispatchEvent(new CustomEvent("aliaskdesk:navigate", { detail: "aliases" }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[14vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c]/95 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] accent-glow"
        role="dialog"
        aria-label="Quick copy palette"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <Search className="h-4 w-4 text-accent" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (matches[0]) copy(matches[0].id, matches[0].address);
              }
              if (e.key === "Escape") onOpenChange(false);
            }}
            placeholder="Type two characters — matching alias appears…"
            className="addr-mono flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-white/30"
          />
          <kbd className="kbd-obsidian">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {matches.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-white/50">No alias matches <span className="addr-mono text-accent">{query}</span></p>
              <button onClick={go} className="mt-2 text-xs text-accent hover:underline">
                Open the alias workspace instead →
              </button>
            </div>
          ) : (
            matches.map((r, i) => (
              <button
                key={r.id}
                onClick={() => copy(r.id, r.address)}
                className={cn(
                  "group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left transition",
                  i === 0 ? "bg-accent-soft" : "hover:bg-white/[0.04]"
                )}
              >
                <span className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition",
                  copiedId === r.id
                    ? "border-[var(--success-c)]/50 bg-[var(--success-c)]/10 text-[var(--success-c)]"
                    : "border-white/10 bg-white/[0.03] text-white/40 group-hover:text-accent"
                )}>
                  {copiedId === r.id ? <Check className="h-4 w-4" /> : <span className="font-display text-xs font-bold">{i === 0 ? "↵" : r.localPart[0]?.toUpperCase()}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="addr-mono truncate text-sm font-semibold">
                    <span className="text-accent">{r.localPart}</span>
                    <span className="text-white/40">@{r.domain}</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.name} · {r.enabled ? "active" : "disabled"}</p>
                </div>
                {copiedId === r.id && (
                  <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xs font-semibold text-[var(--success-c)]">
                    Copied ✓
                  </motion.span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[11px] text-white/35">
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> Enter copies the top match
          </span>
          <span>Quick Copy · works over every zone</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
