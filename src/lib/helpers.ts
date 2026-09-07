import type { Rule, AliasMeta, CfErrorKind } from "./types";

/* ---------- time ---------- */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ---------- validation ---------- */
const LOCAL_RE = /^[a-z0-9]([a-z0-9._+-]{0,62}[a-z0-9])?$/;
export function validateLocalPart(local: string): string | null {
  if (!local) return "Local part is required";
  if (local.length > 64) return "Max 64 characters";
  if (!LOCAL_RE.test(local)) return "Only a-z, 0-9, dots, dashes, + and _ allowed";
  return null;
}
export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return null;
}

/* ---------- export builders (RFC 4180 for CSV) ---------- */
export interface ExportRow {
  rule: Rule;
  meta: AliasMeta;
}

const csvCell = (v: string) =>
  /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function buildExport(rows: ExportRow[], format: "txt" | "csv" | "json"): string {
  if (format === "txt") {
    return rows.map((r) => r.rule.address).join("\n") + "\n";
  }
  if (format === "csv") {
    const head = "address,target,enabled,tags,note";
    const body = rows.map(({ rule, meta }) =>
      [
        csvCell(rule.address),
        csvCell(rule.actions[0]?.value.join("; ") ?? ""),
        rule.enabled ? "true" : "false",
        csvCell(meta.tags.join("; ")),
        csvCell(meta.note),
      ].join(",")
    );
    return [head, ...body].join("\n") + "\n";
  }
  return JSON.stringify(
    rows.map(({ rule, meta }) => ({
      address: rule.address,
      name: rule.name,
      enabled: rule.enabled,
      forward_to: rule.actions[0]?.value ?? [],
      priority: rule.priority,
      created_at: rule.createdAt,
      modified_at: rule.modified,
      local_meta: {
        pinned: meta.pinned,
        tags: meta.tags,
        note: meta.note,
      },
    })),
    null,
    2
  );
}

export const MIME: Record<string, string> = {
  txt: "text/plain", csv: "text/csv", json: "application/json",
};

export function downloadContent(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

/* ---------- misc ---------- */
export function statusTint(enabled: boolean): { dot: string; label: string } {
  return enabled
    ? { dot: "bg-[var(--success-c)]", label: "text-[var(--success-c)]" }
    : { dot: "bg-white/25", label: "text-white/40" };
}

export const errTitle: Record<CfErrorKind, string> = {
  malformed_token: "Malformed token",
  unauthorized: "Unauthorized token",
  rate_limited: "Rate limited",
  network: "Network unreachable",
  not_found: "Not found",
  validation: "Validation failed",
  unknown: "Unexpected error",
};

/* Local part suggestions for the create-alias dialog */
export const LOCAL_PART_SUGGESTIONS = [
  "hello", "hi", "contact", "billing", "support", "admin",
  "press", "legal", "careers", "sales", "team", "me",
  "dev", "ops", "finance", "newsletter", "alerts", "shop",
  "work", "personal", "temp", "verify", "no-reply", "postmaster",
];

export function suggestLocalParts(seed: string): string[] {
  const s = seed.trim().toLowerCase().replace(/[^a-z0-9+._-]/g, "");
  const base = LOCAL_PART_SUGGESTIONS.filter((p) => p.startsWith(s || "h"));
  const patterned = s
    ? [s, `${s}-team`, `${s}-2026`, `${s}.inbox`, `my-${s}`, `${s}-official`]
    : LOCAL_PART_SUGGESTIONS.slice(0, 6);
  return Array.from(new Set([...patterned, ...base])).slice(0, 8);
}
