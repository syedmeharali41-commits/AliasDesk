"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Info, ShieldCheck, Waypoints } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useApp, useActiveZone } from "@/lib/store";
import { CopyButton, SectionHeader } from "@/components/kit";
import { cn } from "@/lib/utils";
import type { CatchAllRule, DnsRecord } from "@/lib/types";

const EMPTY_DNS: DnsRecord[] = [];

export default function CatchAllDns() {
  const zone = useActiveZone();
  const activeZoneId = useApp((s) => s.activeZoneId);
  const catchAll = useApp((s) => s.catchAll[s.activeZoneId]);
  const setCatchAll = useApp((s) => s.setCatchAll);
  const destinations = useApp((s) => s.destinations);
  const dnsMap = useApp((s) => s.dns);
  const dns = useMemo(
    () => dnsMap[activeZoneId] ?? EMPTY_DNS,
    [dnsMap, activeZoneId]
  );

  const verified = destinations.filter((d) => d.verified);

  const requiredRecords = dns.filter((r) => r.required);
  const others = dns.filter((r) => !r.required);
  const mxOk = requiredRecords.some((r) => r.type === "MX");
  const txtOk = requiredRecords.some((r) => r.type === "TXT");

  /* server-state signature — a refetch that changes the catch-all
   * remounts the editor, rebuilding the form instead of fighting input */
  const serverSig = `${zone?.id ?? ""}:${catchAll?.enabled ? 1 : 0}:${catchAll?.actions[0]?.value.join("|") ?? ""}`;

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Catch-All & DNS"
        title={`Zone-level routing — ${zone?.name ?? ""}`}
        sub="The catch-all absorbs every address no explicit rule matches. DNS records below are read-only: copy the exact MX and TXT values Cloudflare expects."
      />

      {/* catch-all editor — keyed to server state */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <CatchAllEditor
          key={serverSig}
          zoneId={zone?.id ?? ""}
          serverRule={catchAll}
          verifiedEmails={verified.map((d) => d.email)}
          onPersist={setCatchAll}
        />
      </motion.div>

      {/* DNS records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="overline-label">Email Routing DNS records — read only</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={cn("inline-flex items-center gap-1.5", mxOk ? "text-[var(--success-c)]" : "text-[var(--warning-c)]")}>
              <ShieldCheck className="h-3.5 w-3.5" /> MX {mxOk ? "present" : "missing"}
            </span>
            <span className={cn("inline-flex items-center gap-1.5", txtOk ? "text-[var(--success-c)]" : "text-[var(--warning-c)]")}>
              <ShieldCheck className="h-3.5 w-3.5" /> SPF/DKIM {txtOk ? "present" : "missing"}
            </span>
          </div>
        </div>

        {dns.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-muted-foreground">
            No DNS records cached for this zone. In live mode, run a sync from the toolbar.
          </div>
        ) : (
          <div className="glass-card overflow-hidden p-0">
            {[
              { label: "Routing-critical", rows: requiredRecords },
              { label: "Other records", rows: others },
            ].map((group) =>
              group.rows.length ? (
                <div key={group.label}>
                  <p className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {group.label}
                  </p>
                  {group.rows.map((r, i) => (
                    <DnsRow key={r.id} rec={r} index={i} />
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Catch-all editor (remounts on server change) ============ */
function CatchAllEditor({
  zoneId, serverRule, verifiedEmails, onPersist,
}: {
  zoneId: string;
  serverRule: CatchAllRule | undefined;
  verifiedEmails: string[];
  onPersist: (zoneId: string, rule: CatchAllRule) => void;
}) {
  const [enabled, setEnabled] = useState(serverRule?.enabled ?? false);
  const [target, setTarget] = useState<string>(
    serverRule?.actions[0]?.value[0] ?? verifiedEmails[0] ?? ""
  );

  async function persist(nextEnabled: boolean, nextTarget: string) {
    if (nextEnabled && (!nextTarget && verifiedEmails.length === 0)) {
      toast.error("No verified destination email found", {
        description: "Please add and verify your Gmail in Cloudflare or the Destinations tab first.",
      });
      setEnabled(false);
      return;
    }
    const chosenTarget = nextTarget || verifiedEmails[0] || "";
    const rule: CatchAllRule = {
      enabled: nextEnabled,
      name: "Catch-all",
      actions: nextEnabled && chosenTarget ? [{ type: "forward", value: [chosenTarget] }] : [{ type: "drop" as const }],
    };
    const res = await fetch("/api/cloudflare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "catchall.put",
        token: useApp.getState().connection.token,
        zoneId,
        payload: {
          body: {
            name: "Catch-all",
            enabled: nextEnabled,
            actions: nextEnabled && chosenTarget ? [{ type: "forward", value: [chosenTarget] }] : [{ type: "drop" }],
            matchers: [{ type: "all", field: "to" }],
          },
        },
      }),
    }).then((r) => r.json());
    if (!res.ok) {
      toast.error("Cloudflare rejected the catch-all update", { description: res.err?.message });
      /* revert to server state */
      setEnabled(serverRule?.enabled ?? false);
      setTarget(serverRule?.actions[0]?.value[0] ?? verifiedEmails[0] ?? "");
      return;
    }
    onPersist(zoneId, rule);
    toast.success(nextEnabled ? "Catch-all enabled on Cloudflare" : "Catch-all disabled");
  }

  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl border",
            enabled ? "border-accent-soft bg-accent-soft text-accent" : "border-white/10 bg-white/[0.03] text-white/40"
          )}>
            <Waypoints className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">Catch-all rule</p>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? <>Unmatched mail forwards to <span className="addr-mono text-white font-medium">{target || verifiedEmails[0] || "—"}</span></>
                : "Unmatched mail is rejected with an SMTP error"}
            </p>
          </div>
        </div>
        <Switch
          id="switch-catchall"
          checked={enabled}
          onCheckedChange={(v) => { setEnabled(v); persist(v, target || verifiedEmails[0] || ""); }}
          className="data-[state=checked]:bg-accent cursor-pointer"
          aria-label="Toggle catch-all"
        />
      </div>

      <div className={cn("mt-5 grid gap-3 transition sm:grid-cols-[1fr_auto]", !enabled && "pointer-events-none opacity-40")}>
        <div>
          <label className="overline-label mb-2 block">Forward unmatched mail to</label>
          {verifiedEmails.length === 0 ? (
            <div className="rounded-lg border border-[var(--warning-c)]/30 bg-[var(--warning-c)]/[0.08] p-3 text-xs text-[var(--warning-c)]">
              ⚠️ No verified destination addresses found on Cloudflare yet. Please add and verify your Gmail first.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {verifiedEmails.map((email) => (
                <button
                  key={email}
                  onClick={() => { setTarget(email); persist(enabled, email); }}
                  className={cn(
                    "addr-mono inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition",
                    (target || verifiedEmails[0]) === email
                      ? "border-accent/60 bg-accent/[0.06] text-white font-medium"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25"
                  )}
                >
                  {(target || verifiedEmails[0]) === email && <Check className="h-3.5 w-3.5 text-accent" />}
                  {email}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        The editor is keyed to server state — a background refetch rebuilds the form instead of
        fighting your input, a fix proven necessary in the web edition.
      </p>
    </div>
  );
}

/* ============ DNS row ============ */
function DnsRow({ rec, index }: { rec: DnsRecord; index: number }) {
  const [showFull, setShowFull] = useState(false);
  const typeTint: Record<string, string> = {
    MX: "text-accent border-accent-soft bg-accent-soft",
    TXT: "text-[var(--success-c)] border-[var(--success-c)]/30 bg-[var(--success-c)]/10",
    CNAME: "text-white/60 border-white/15 bg-white/[0.04]",
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.05] px-5 py-3.5 last:border-0 hover:bg-white/[0.015]"
    >
      <span className={cn("w-16 rounded-md border px-2 py-1 text-center text-[11px] font-bold tracking-wide", typeTint[rec.type])}>
        {rec.type}
      </span>
      <div className="min-w-0 flex-1">
        <p className="addr-mono text-[13px] font-semibold">{rec.name}</p>
        <p className={cn("addr-mono mt-0.5 text-xs text-white/45", !showFull && rec.content.length > 52 && "truncate")}>
          {showFull ? rec.content : rec.content.slice(0, 52) + (rec.content.length > 52 ? "…" : "")}
        </p>
      </div>
      <span className="tabular hidden text-xs text-white/35 sm:block">
        {rec.priority != null ? `prio ${rec.priority} · ` : ""}TTL {rec.ttl === 1 ? "auto" : rec.ttl}
      </span>
      {rec.content.length > 52 ? (
        <button
          onClick={() => setShowFull(!showFull)}
          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/50 transition hover:border-accent-soft hover:text-accent"
        >
          {showFull ? "Less" : "Full"}
        </button>
      ) : null}
      <CopyButton text={rec.content} />
    </motion.div>
  );
}
