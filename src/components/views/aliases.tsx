"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowDownUp, AtSign, Bookmark, Check, ChevronDown, Copy, Dices, Fingerprint, Hash,
  Loader2, Mail, Minus, MoreHorizontal, NotebookPen, Pin, PinOff, Plus,
  Search, Send, Sparkles, Tag, Trash2, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp, useActiveZone, metaOf } from "@/lib/store";
import { ConfirmNameDialog, EmptyState, CopyButton, TagChip } from "@/components/kit";
import { AliasBrowserControl } from "@/components/browser-launcher";
import { useBrowserSessions } from "@/lib/browser-session-store";
import { suggestLocalParts, validateLocalPart, timeAgo } from "@/lib/helpers";
import { cfApi, buildRuleBody, mapRule } from "@/lib/cf-client";
import { cn } from "@/lib/utils";
import type { Rule } from "@/lib/types";

type StatusFilter = "all" | "pinned" | "custom" | "later";
type SortKey = "newest" | "address" | "priority";

export default function Aliases() {
  const zone = useActiveZone();
  const allRules = useApp((s) => s.rules);
  const activeZoneId = useApp((s) => s.activeZoneId);
  const destinations = useApp((s) => s.destinations);
  const aliasMeta = useApp((s) => s.aliasMeta);
  const tokenHint = useApp((s) => s.connection.tokenHint);
  const clearZoneRules = useApp((s) => s.clearZoneRules);
  const rules = useMemo(
    () => allRules
      .filter((r) => r.zoneId === activeZoneId || r.domain === zone?.name || !r.zoneId)
      .filter((r) => r.localPart && r.localPart.trim().length > 0 && r.address && !r.address.startsWith("@")),
    [allRules, activeZoneId, zone?.name]
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    rules.forEach((r) => metaOf(aliasMeta, r.id).tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [rules, aliasMeta]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rules.filter((r) => {
      const meta = metaOf(aliasMeta, r.id);
      if (status === "pinned" && !meta.pinned) return false;
      if (status === "custom" && !r.isCustom) return false;
      if (status === "later" && !meta.savedForLater) return false;
      if (tag && !meta.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        r.address.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        meta.note.toLowerCase().includes(q) ||
        meta.tags.some((t) => t.includes(q)) ||
        r.actions[0]?.value.some((v) => v.toLowerCase().includes(q))
      );
    });
    list = [...list].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [rules, query, status, tag, aliasMeta]);

  const pagedRules = useMemo(() => {
    const start = page * pageSize;
    return visible.slice(start, start + pageSize);
  }, [visible, page]);

  const verified = destinations.filter((d) => d.verified);

  return (
    <div className="space-y-6">
      {/* header + toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 enter-anim">
        <div>
          <p className="overline-label mb-2 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Aliases — {zone?.name}
          </p>
          <h1 className="display-title text-3xl">Routing rules workspace</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {status === "custom" ? (
            <Button id="btn-new-alias" onClick={() => setCreateOpen(true)} className="btn-accent h-10 gap-2 rounded-lg px-4 text-sm font-semibold cursor-pointer">
              <Plus className="h-4 w-4" /> New custom alias
            </Button>
          ) : rules.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm(`Delete all ${rules.length} aliases in this workspace?`)) {
                  clearZoneRules(activeZoneId);
                  setPage(0);
                  toast.success("All aliases cleared");
                }
              }}
              className="btn-ghosty border border-rose-500/20 bg-rose-500/[0.05] h-10 gap-1.5 rounded-lg px-4 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/40 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all aliases ({rules.length})
            </Button>
          ) : (
            <Button id="btn-new-alias" onClick={() => setCreateOpen(true)} className="btn-accent h-10 gap-2 rounded-lg px-4 text-sm font-semibold cursor-pointer">
              <Plus className="h-4 w-4" /> New alias
            </Button>
          )}
        </div>
      </div>

      {/* search + filters */}
      <div className="glass-card flex flex-wrap items-center gap-3 p-3.5">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search address, target, tag or note…"
            className="input-obsidian w-full rounded-md py-2.5 pl-9 pr-3 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
          {(["all", "pinned", "custom", "later"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition cursor-pointer",
                status === s
                  ? "bg-accent text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "text-white/60 hover:text-white"
              )}
            >
              {s === "pinned" ? "Pinned" : s === "custom" ? "Custom" : s === "later" ? "Use Later" : "All"}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn-ghosty inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs text-white/70">
                <Tag className="h-3.5 w-3.5" /> {tag ?? "All tags"} <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#0c0c0d]">
              <DropdownMenuItem onClick={() => { setTag(null); setPage(0); }}>All tags</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {allTags.map((t) => (
                <DropdownMenuItem key={t} onClick={() => { setTag(t); setPage(0); }} className="addr-mono">
                  #{t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <span className="tabular ml-auto pr-1 text-xs text-white/40">
          {visible.length.toLocaleString()} / {rules.length.toLocaleString()} shown
        </span>
      </div>

      {/* list */}
      {visible.length === 0 ? (
        <EmptyState
          icon={status === "custom" ? <Sparkles className="h-6 w-6 text-accent" /> : status === "pinned" ? <Pin className="h-6 w-6 text-accent" /> : <AtSign className="h-6 w-6" />}
          title={
            status === "custom"
              ? "No custom aliases yet"
              : status === "pinned"
              ? "No pinned aliases"
              : rules.length === 0
              ? "No aliases yet"
              : "Nothing matches this view"
          }
          sub={
            status === "custom"
              ? `Create unique individual aliases like admin@${zone?.name ?? "domain"}, billing@, support@, etc.`
              : status === "pinned"
              ? "Pin important aliases in your workspace to quickly access them here."
              : rules.length === 0
              ? "Create single or bulk aliases — mail sent to these addresses will forward directly to your destination."
              : "Try clearing your search query or active filter."
          }
          action={
            status === "custom" ? (
              <Button onClick={() => setCreateOpen(true)} className="btn-accent mt-2 h-10 rounded-lg px-4 text-sm font-semibold cursor-pointer">
                <Plus className="h-4 w-4" /> Create custom alias
              </Button>
            ) : rules.length === 0 ? (
              <Button onClick={() => setCreateOpen(true)} className="btn-accent mt-2 h-10 rounded-lg px-4 text-sm font-semibold cursor-pointer">
                <Plus className="h-4 w-4" /> New alias
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {pagedRules.map((r, i) => (
            <AliasRow
              key={r.id}
              rule={r}
              index={i}
              verified={verified.map((d) => d.email)}
              tokenHint={tokenHint}
            />
          ))}

          {/* Pagination controls for high-volume pools */}
          {visible.length > pageSize && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60 mt-4">
              <span>
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, visible.length)} of {visible.length.toLocaleString()} aliases
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={page === 0}
                  onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="btn-ghosty h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <span className="addr-mono font-semibold text-accent">
                  Page {page + 1} of {Math.ceil(visible.length / pageSize)}
                </span>
                <Button
                  variant="ghost"
                  disabled={(page + 1) * pageSize >= visible.length}
                  onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="btn-ghosty h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateAliasDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        domain={zone?.name ?? ""}
        verified={verified}
        defaultTab={status === "custom" ? "custom" : "pool"}
      />
    </div>
  );
}

/* ============================================================ */
/* ======================= ROW ================================ */
/* ============================================================ */

function AliasRow({
  rule, index, verified, tokenHint,
}: {
  rule: Rule; index: number; verified: string[];
  tokenHint: string;
}) {
  const meta = useApp((s) => metaOf(s.aliasMeta, rule.id));
  const deleteRule = useApp((s) => s.deleteRule);
  const togglePin = useApp((s) => s.togglePin);
  const toggleUseLater = useApp((s) => s.toggleUseLater);
  const [copied, setCopied] = useState(false);

  // Active browser session detection
  const sessionKey = rule.address.toLowerCase().trim();
  const activeSession = useBrowserSessions((s) => s.sessions[sessionKey]);
  const isSessionActive = !!(activeSession && activeSession.status !== "destroyed");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rule.address);
      setCopied(true);
      toast.success(`Copied ${rule.address}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  }

  async function handleDelete() {
    deleteRule(rule.id);
    toast.success(`Deleted ${rule.address}`);
    // if on cloudflare, delete in background
    if (rule.id && !rule.id.startsWith("cuid_")) {
      cfApi.deleteRule(getToken(), rule.zoneId, rule.id).catch(() => {});
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass-card group relative overflow-hidden p-0 transition-all duration-300",
        isSessionActive
          ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-[#0d2218]/90 to-[#07140f]/95 shadow-[0_0_25px_rgba(16,185,129,0.16)] ring-1 ring-emerald-500/30"
          : meta.pinned
          ? "border-accent-soft"
          : ""
      )}
    >
      {isSessionActive ? (
        <span className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
      ) : meta.pinned ? (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
      ) : null}

      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        {/* Click-to-Copy Identity & Badges */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                title="Click to copy address"
                className="addr-mono inline-flex items-center gap-1.5 truncate text-sm font-semibold hover:text-white transition cursor-pointer select-none"
              >
                <span className={cn(isSessionActive ? "text-emerald-200 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]" : "text-white")}>
                  {rule.address}
                </span>
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--success-c)] animate-in fade-in">
                    <Check className="h-3 w-3" /> Copied
                  </span>
                ) : (
                  <Copy className="h-3 w-3 text-white/25 hover:text-white/60 transition" />
                )}
              </button>

              {isSessionActive && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Active Working
                </span>
              )}

              {meta.pinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/[0.1] px-1.5 py-0.5 rounded border border-accent/25">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}

              {meta.savedForLater && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-400/[0.1] px-1.5 py-0.5 rounded border border-sky-400/25">
                  <Bookmark className="h-2.5 w-2.5" /> Use Later
                </span>
              )}

              {rule.isCustom && (
                <span className="text-[10px] font-semibold text-accent/90 bg-accent/[0.08] px-2 py-0.5 rounded-md border border-accent/20">
                  Custom
                </span>
              )}
            </div>
            {((rule.actions[0]?.value && rule.actions[0]?.value.length > 0) || verified.length > 0) && (
              <div className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
                <span className="inline-flex items-center gap-1 truncate">
                  <Send className="h-3 w-3 text-white/35 shrink-0" />
                  {rule.actions[0]?.value?.join(", ") || verified[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Isolated Browser Sandbox Launcher & Active HUD + 3-Dot Actions Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <AliasBrowserControl
            alias={rule.address}
            onDestroyAlias={handleDelete}
          />

          {/* 3-Dot Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Options"
                aria-label="Options"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-white/40 hover:text-white hover:border-white/20 transition cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-white/10 bg-[#0d0d0f]/95 backdrop-blur-xl shadow-2xl p-1">
              <DropdownMenuItem
                onClick={() => togglePin(rule.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/80 hover:text-white cursor-pointer focus:bg-white/10"
              >
                {meta.pinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5 text-accent" />
                    <span>Unpin Alias</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5 text-white/60" />
                    <span>Pin to Top</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => toggleUseLater(rule.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/80 hover:text-white cursor-pointer focus:bg-white/10"
              >
                <Bookmark className={cn("h-3.5 w-3.5", meta.savedForLater ? "text-sky-400" : "text-white/60")} />
                <span>{meta.savedForLater ? "Remove from Later" : "Use Later"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              <DropdownMenuItem
                onClick={handleDelete}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 focus:bg-rose-500/15 cursor-pointer font-medium"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Delete Alias</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================ */
/* ================== CREATE ALIAS DIALOG ===================== */
/* ============================================================ */
function CreateAliasDialog({
  open, onOpenChange, domain, verified, defaultTab,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  domain: string; verified: { email: string }[];
  defaultTab?: "custom" | "pool";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        defaultTab === "custom" ? (
          <CreateCustomAliasForm
            domain={domain}
            verified={verified.map((d) => d.email)}
            onOpenChange={onOpenChange}
          />
        ) : (
          <CreatePoolAliasForm
            domain={domain}
            verified={verified.map((d) => d.email)}
            onOpenChange={onOpenChange}
          />
        )
      )}
    </Dialog>
  );
}

/* ------------------------------------------------------------ */
/* 1. CUSTOM SINGLE ALIAS FORM (e.g. admin@, support@)          */
/* ------------------------------------------------------------ */
function CreateCustomAliasForm({
  domain, verified, onOpenChange,
}: {
  domain: string; verified: string[]; onOpenChange: (v: boolean) => void;
}) {
  const createRule = useApp((s) => s.createRule);
  const allRules = useApp((s) => s.rules);

  const [local, setLocal] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState<string>(verified[0] ?? "");
  const [busy, setBusy] = useState(false);

  const clean = local.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const customAddress = `${clean}@${domain}`;
  const isDupe = clean.length > 0 && allRules.some((r) => r.address.toLowerCase() === customAddress.toLowerCase());
  const valid = clean.length > 0 && !isDupe && !!target;

  async function submit() {
    if (!valid || verified.length === 0) return;
    setBusy(true);

    const rule = createRule({ localPart: clean, domain, name: name.trim() || `${clean} custom`, targets: [target], isCustom: true });
    if (rule) {
      const res = await cfApi.createRule(
        getToken(),
        rule.zoneId,
        buildRuleBody({ localPart: clean, domain, name: name.trim() || `${clean} custom`, targets: [target] })
      );
      if (!res.ok) {
        useApp.getState().deleteRule(rule.id);
        toast.error("Cloudflare rejected the create", { description: res.err?.message });
        setBusy(false);
        return;
      }
      useApp.setState((st) => ({
        rules: st.rules.map((r) => (r.id === rule.id ? { ...mapRule(res.data as never, domain, rule.zoneId), isCustom: true } : r)),
      }));
    }
    setBusy(false);
    onOpenChange(false);
    toast.success(
      <span className="addr-mono text-[13px]">{clean}@{domain} is live</span>,
      { description: "Custom alias created and active." }
    );
  }

  return (
    <DialogContent className="border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl sm:max-w-[480px] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
      <DialogHeader className="pb-1 pr-8">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/80 border border-white/10">
            <Sparkles className="h-4 w-4 text-accent" />
          </span>
          <DialogTitle className="font-display text-lg font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
            Create Custom Alias
            <span className="addr-mono rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs font-normal text-white/60">
              @{domain}
            </span>
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-white/50 pt-1">
          Create a unique named alias (e.g. admin, support, billing) for this domain.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        {/* Custom Alias Name Input */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
            Custom Alias Name
          </label>
          <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.02] focus-within:border-accent/80 focus-within:ring-1 focus-within:ring-accent/30 transition shadow-inner">
            <span className="pl-3.5 pr-1 text-white/30">
              <AtSign className="h-4 w-4" />
            </span>
            <input
              id="input-alias-local"
              autoFocus
              value={local}
              onChange={(e) => setLocal(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. admin, ceo, billing, contact, support"
              spellCheck={false}
              className="addr-mono w-full bg-transparent px-2.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            <span className="addr-mono mr-2 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/50">
              @{domain}
            </span>
          </div>
        </div>

        {/* Availability / Error Card */}
        {clean.length > 0 && (
          isDupe ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-3 text-xs text-rose-300 flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <div>
                <span className="font-semibold">{customAddress}</span> already exists in your workspace. You must delete the existing <b>{clean}</b> alias before creating it again.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-2.5 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span><b>{customAddress}</b> is available to create.</span>
            </div>
          )
        )}

        {/* Forward Target Card */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
            Forwarding Destination
          </label>
          {verified.length === 0 ? (
            <p className="rounded-xl border border-[var(--warning-c)]/30 bg-[var(--warning-c)]/[0.06] p-3 text-xs text-[var(--warning-c)]">
              No verified destinations yet — add one in Destinations view first.
            </p>
          ) : (
            <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
              {verified.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setTarget(email)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition cursor-pointer",
                    target === email
                      ? "border-accent/50 bg-accent/[0.04] text-white font-medium"
                      : "border-white/[0.08] bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-white/50" />
                    <span className="addr-mono text-white/90">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Verified
                    </span>
                    {target === email && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          id="btn-submit-alias"
          onClick={submit}
          disabled={!valid || busy || verified.length === 0}
          className="btn-accent h-11 w-full text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.99] cursor-pointer"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : isDupe ? (
            <>
              <X className="h-4 w-4" /> "{clean}" Already Exists (Delete First)
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Create "{clean || "admin"}@{domain}" Custom Alias
            </>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

/* ------------------------------------------------------------ */
/* 2. POOL GENERATOR FORM (1 to 10,000 Bulk Batch)              */
/* ------------------------------------------------------------ */
function CreatePoolAliasForm({
  domain, verified, onOpenChange,
}: {
  domain: string; verified: string[]; onOpenChange: (v: boolean) => void;
}) {
  const createRulesBulk = useApp((s) => s.createRulesBulk);
  const clearZoneRules = useApp((s) => s.clearZoneRules);
  const getNextSequence = useApp((s) => s.getNextSequence);
  const advanceSequence = useApp((s) => s.advanceSequence);
  const activeZoneId = useApp((s) => s.activeZoneId);
  const allRules = useApp((s) => s.rules);

  const [local, setLocal] = useState("");
  const [count, setCount] = useState<number>(100);
  const [patternType, setPatternType] = useState<"numbered" | "dot" | "salt" | "id">("numbered");
  const [name, setName] = useState("");
  const [target, setTarget] = useState<string>(verified[0] ?? "");
  const [busy, setBusy] = useState(false);

  const currentZoneRules = useMemo(
    () => allRules.filter((r) => r.zoneId === activeZoneId || r.domain === domain || !r.zoneId),
    [allRules, activeZoneId, domain]
  );

  const clean = local.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const valid = !!target && count >= 1;

  /* Dynamic Non-Repeating Sequence Preview */
  const previewText = useMemo(() => {
    const base = clean || "user";
    const startSeq = getNextSequence(base);
    const endSeq = startSeq + count - 1;
    const padLen = Math.max(4, String(endSeq).length);

    let sample1 = "";
    let sample2 = "";
    if (patternType === "numbered") {
      sample1 = `${base}_${String(startSeq).padStart(padLen, "0")}@${domain}`;
      sample2 = `${base}_${String(endSeq).padStart(padLen, "0")}@${domain}`;
    } else if (patternType === "dot") {
      sample1 = `${base}.${startSeq}@${domain}`;
      sample2 = `${base}.${endSeq}@${domain}`;
    } else if (patternType === "id") {
      sample1 = `id_${startSeq}_9f82a@${domain}`;
      sample2 = `id_${endSeq}_3b14c@${domain}`;
    } else {
      sample1 = `${base}_${String(startSeq).padStart(padLen, "0")}_8492@${domain}`;
      sample2 = `${base}_${String(endSeq).padStart(padLen, "0")}_1942@${domain}`;
    }
    return `${sample1}  →  ${sample2}`;
  }, [clean, domain, count, patternType, getNextSequence]);

  async function submit() {
    if (!valid || verified.length === 0) return;
    setBusy(true);

    if (currentZoneRules.length > 0) {
      clearZoneRules(activeZoneId);
    }

    const base = clean || "user";
    const startSeq = advanceSequence(base, count);
    const endSeq = startSeq + count - 1;
    const padLen = Math.max(4, String(endSeq).length);

    const inputs = [];
    for (let i = startSeq; i <= endSeq; i++) {
      let localPart = "";
      if (patternType === "numbered") {
        localPart = `${base}_${String(i).padStart(padLen, "0")}`;
      } else if (patternType === "dot") {
        localPart = `${base}.${i}`;
      } else if (patternType === "id") {
        localPart = `id_${i}_${Math.random().toString(36).substring(2, 7)}`;
      } else {
        localPart = `${base}_${String(i).padStart(padLen, "0")}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
      inputs.push({
        localPart,
        domain,
        name: name.trim() || `${base} bulk`,
        targets: [target],
      });
    }
    const createdCount = createRulesBulk(inputs);
    setBusy(false);
    onOpenChange(false);
    toast.success(
      `Generated ${createdCount.toLocaleString()} fresh unique aliases on ${domain}!`,
      { description: "Previous batch replaced. Unique sequence preserved." }
    );
  }

  return (
    <DialogContent className="border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl sm:max-w-[520px] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
      <DialogHeader className="pb-1 pr-8">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/80 border border-white/10">
            <Zap className="h-4 w-4 text-accent" />
          </span>
          <DialogTitle className="font-display text-lg font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
            Create Aliases
            <span className="addr-mono rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs font-normal text-white/60">
              @{domain}
            </span>
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-white/50 pt-1">
          Generate non-repeating batch pools into your workspace.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-1">
        {/* Prefix Name */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
            Prefix Name (Optional)
          </label>
          <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.02] focus-within:border-accent/80 focus-within:ring-1 focus-within:ring-accent/30 transition shadow-inner">
            <span className="pl-3.5 pr-1 text-white/30">
              <AtSign className="h-4 w-4" />
            </span>
            <input
              autoFocus
              value={local}
              onChange={(e) => setLocal(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. user, bot, trial"
              spellCheck={false}
              className="addr-mono w-full bg-transparent px-2.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            <span className="addr-mono mr-2 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/50">
              @{domain}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/60">Quantity</label>
            <span className="addr-mono text-xs text-accent font-semibold">
              {count.toLocaleString()} aliases
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {([
              [10, "10"],
              [100, "100"],
              [1000, "1,000"],
            ] as const).map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => setCount(p)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-xs font-semibold transition text-center cursor-pointer h-9",
                  count === p
                    ? "border-accent bg-accent text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}

            <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.02] flex-1 h-9 px-1 focus-within:border-accent/80 transition">
              <button
                type="button"
                onClick={() => setCount((c) => Math.max(1, c - 10))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition shrink-0 cursor-pointer"
                title="-10"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={100000}
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCount(isNaN(val) || val < 1 ? 1 : Math.min(val, 100000));
                }}
                className="addr-mono w-full bg-transparent text-center text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setCount((c) => Math.min(100000, c + 10))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition shrink-0 cursor-pointer"
                title="+10"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pattern Style Cards */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block">Pattern Format</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["numbered", "Numbered", Hash, `${clean || "user"}_0001`, `@${domain}`],
              ["dot", "Dot Number", Sparkles, `${clean || "user"}.1`, `@${domain}`],
              ["salt", "Random Salt", Dices, `${clean || "user"}_0001_8492`, `@${domain}`],
              ["id", "Short ID", Fingerprint, `id_1_9f82a`, `@${domain}`],
            ] as const).map(([pKey, pLabel, Icon, pPrefix, pDomain]) => {
              const active = patternType === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setPatternType(pKey)}
                  className={cn(
                    "group flex flex-col items-start rounded-xl border p-2.5 text-left transition cursor-pointer relative overflow-hidden",
                    active
                      ? "border-accent/80 bg-accent/[0.04] shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "text-white/40 group-hover:text-white/70")} />
                      {pLabel}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                  <span className="addr-mono text-[11px] truncate w-full">
                    <span className={cn("font-medium", active ? "text-white" : "text-white/70")}>{pPrefix}</span>
                    <span className="text-white/35">{pDomain}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Preview */}
        <div className="rounded-xl border border-white/[0.08] bg-[#08080a] p-3 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Terminal Sequence
            </span>
            <span className="addr-mono text-[10px] rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-white/60 font-semibold">
              {count.toLocaleString()} total
            </span>
          </div>
          <p className="addr-mono text-xs text-white/85 truncate select-all tracking-tight font-medium">
            {previewText}
          </p>
        </div>

        {/* Forward Target Card */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
            Forwarding Destination
          </label>
          {verified.length === 0 ? (
            <p className="rounded-xl border border-[var(--warning-c)]/30 bg-[var(--warning-c)]/[0.06] p-3 text-xs text-[var(--warning-c)]">
              No verified destinations yet — add one in Destinations view first.
            </p>
          ) : (
            <div className="flex max-h-28 flex-col gap-1.5 overflow-y-auto pr-1">
              {verified.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setTarget(email)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition cursor-pointer",
                    target === email
                      ? "border-accent/50 bg-accent/[0.04] text-white font-medium"
                      : "border-white/[0.08] bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-white/50" />
                    <span className="addr-mono text-white/90">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Verified
                    </span>
                    {target === email && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={submit}
          disabled={!valid || busy || verified.length === 0}
          className="btn-accent h-11 w-full text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.99] cursor-pointer"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Generate {count.toLocaleString()} Aliases into Main Table
            </>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

/* live-mode helpers — token travels only to our proxy route */
function getToken(): string {
  return useApp.getState().connection.token;
}

async function cfUpdateEnabled(rule: Rule, next: boolean) {
  return cfApi.updateRule(
    getToken(),
    rule.zoneId,
    rule.id,
    {
      ...buildRuleBody({
        localPart: rule.localPart,
        domain: rule.domain,
        name: rule.name,
        targets: rule.actions[0]?.value ?? [],
      }),
      enabled: next,
    }
  );
}
