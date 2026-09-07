/* ============================================================
 * AliasDesk — shared domain types (mirrors Cloudflare API v4)
 * ============================================================ */

export type AccentId = "gold" | "crimson" | "ivory" | "emerald";

export interface Zone {
  id: string;
  name: string;
  status: string; // active | pending ...
  plan: string;
  createdAt: string;
}

export interface RuleAction {
  type: "forward" | "worker" | "drop";
  value: string[]; // destination emails
}

export interface Rule {
  id: string;
  zoneId: string;
  address: string; // full address e.g. hello@acme.dev
  localPart: string;
  domain: string;
  name: string;
  enabled: boolean;
  actions: RuleAction[];
  priority: number;
  isCustom?: boolean;
  createdAt: string;
  modified: string;
}

export interface Destination {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

export interface CatchAllRule {
  enabled: boolean;
  name: string;
  actions: RuleAction[];
}

export interface DnsRecord {
  id: string;
  type: "MX" | "TXT" | "CNAME";
  name: string;
  content: string;
  priority?: number;
  ttl: number;
  proxied: boolean;
  required: boolean; // is it an Email-Routing-critical record?
}

export type ActivityKind =
  | "connect"
  | "disconnect"
  | "create"
  | "delete"
  | "enable"
  | "disable"
  | "pin"
  | "update"
  | "export"
  | "zone"
  | "destination"
  | "catchall"
  | "clear";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  message: string;
  at: string; // ISO
}

export interface AliasMeta {
  pinned: boolean;
  savedForLater?: boolean;
  tags: string[];
  note: string;
}

export interface ConnectionInfo {
  token: string; // web-edition keychain: browser private storage; display always via tokenHint
  tokenHint: string; // last 4 chars only
  connectedAt: string | null;
}

export interface AccountSettings {
  accent: AccentId;
  confirmDeletes: boolean;
}

/* ---- Cloudflare result taxonomy ---- */
export type CfErrorKind =
  | "malformed_token"
  | "unauthorized"
  | "rate_limited"
  | "network"
  | "not_found"
  | "validation"
  | "unknown";

export interface CfResult<T> {
  ok: boolean;
  data?: T;
  err?: { kind: CfErrorKind; message: string };
}

/* ---- API proxy request shape (renderer -> /api/cloudflare) ---- */
export type CfOp =
  | "zones.list"
  | "rules.list"
  | "rules.create"
  | "rules.delete"
  | "rules.update"
  | "destinations.list"
  | "catchall.get"
  | "catchall.put"
  | "dns.list";

export interface CfProxyRequest {
  op: CfOp;
  token: string;
  zoneId?: string;
  payload?: unknown;
}
