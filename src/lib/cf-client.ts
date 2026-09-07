"use client";

import type {
  CfProxyRequest,
  CfResult,
  Zone,
  Rule,
  Destination,
  CatchAllRule,
  DnsRecord,
} from "./types";

/* Renderer-side client for the /api/cloudflare proxy.
 * The token travels only to our own server route, never into
 * any third-party context. */

async function call<T>(req: CfProxyRequest): Promise<CfResult<T>> {
  try {
    const res = await fetch("/api/cloudflare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const json = await res.json();
    if (json.ok) return { ok: true, data: json.data as T };
    return { ok: false, err: json.err };
  } catch {
    return {
      ok: false,
      err: { kind: "network", message: "Could not reach the AliasDesk proxy route." },
    };
  }
}

/* ---------- mappers: Cloudflare shape -> app shape ---------- */

interface CfZoneRaw {
  id: string; name: string; status: string;
  created_on: string;
  plan?: { name?: string };
}
interface CfRuleRaw {
  id: string;
  name?: string;
  enabled: boolean;
  priority?: number;
  created_on?: string;
  modified_on?: string;
  matchers?: { type: string; field: string; value: string }[];
  actions?: { type: string; value: string[] }[];
}
interface CfDestRaw {
  id: string; email: string; verified?: boolean;
  created?: string; created_on?: string;
}
interface CfDnsRaw {
  id: string; type: string; name: string; content: string;
  priority?: number; ttl: number; proxied: boolean;
}

export function mapZone(r: CfZoneRaw): Zone {
  return {
    id: r.id, name: r.name, status: r.status,
    plan: r.plan?.name ?? "Free",
    createdAt: r.created_on ?? new Date().toISOString(),
  };
}

export function mapRule(r: CfRuleRaw, zoneName: string, zoneId?: string): Rule {
  const matcher = r.matchers?.find((m) => m.type === "literal" && m.field === "to");
  const address = matcher?.value ?? "";
  const [localPart, domain] = address.includes("@") ? address.split(/@(.+)/) : ["", zoneName];
  return {
    id: r.id,
    zoneId: zoneId ?? "",
    address,
    localPart,
    domain: domain || zoneName,
    name: r.name || `${localPart} rule`,
    enabled: !!r.enabled,
    actions: (r.actions ?? [])
      .filter((a) => a.type === "forward")
      .map((a) => ({ type: "forward" as const, value: a.value ?? [] })),
    priority: r.priority ?? 0,
    createdAt: r.created_on ?? new Date().toISOString(),
    modified: r.modified_on ?? r.created_on ?? new Date().toISOString(),
  };
}

export function mapDestination(r: CfDestRaw): Destination {
  return {
    id: r.id,
    email: r.email,
    verified: !!r.verified,
    createdAt: r.created ?? r.created_on ?? new Date().toISOString(),
  };
}

export function mapDns(r: CfDnsRaw): DnsRecord {
  const isRoutingCritical =
    r.type === "MX" ||
    (r.type === "TXT" &&
      (/spf|domainkey|dmarc/i.test(r.content) || /domainkey|_dmarc/i.test(r.name)));
  return {
    id: r.id,
    type: r.type as DnsRecord["type"],
    name: r.name,
    content: r.content,
    priority: r.priority,
    ttl: r.ttl,
    proxied: r.proxied,
    required: isRoutingCritical,
  };
}

export function buildRuleBody(input: {
  localPart: string; domain: string; name: string; targets: string[];
}) {
  return {
    actions: [{ type: "forward", value: input.targets }],
    matchers: [{ type: "literal", field: "to", value: `${input.localPart}@${input.domain}` }],
    name: input.name || `${input.localPart} rule`,
    enabled: true,
  };
}

export function buildCatchAllBody(targets: string[]) {
  return {
    name: "Catch-all",
    enabled: true,
    actions: [{ type: "forward", value: targets }],
    matchers: [{ type: "all", field: "to" }],
  };
}

/* ---------- typed API surface ---------- */
export const cfApi = {
  zones: (token: string) =>
    call<CfZoneRaw[]>({ op: "zones.list", token }),
  rules: (token: string, zoneId: string) =>
    call<CfRuleRaw[]>({ op: "rules.list", token, zoneId }),
  createRule: (token: string, zoneId: string, body: unknown) =>
    call<CfRuleRaw>({ op: "rules.create", token, zoneId, payload: { body } }),
  deleteRule: (token: string, zoneId: string, ruleId: string) =>
    call<unknown>({ op: "rules.delete", token, zoneId, payload: { ruleId } }),
  updateRule: (token: string, zoneId: string, ruleId: string, body: unknown) =>
    call<CfRuleRaw>({ op: "rules.update", token, zoneId, payload: { ruleId, body } }),
  destinations: (token: string) =>
    call<CfDestRaw[]>({ op: "destinations.list", token }),
  catchAll: (token: string, zoneId: string) =>
    call<CatchAllRule & { actions: { type: string; value: string[] }[] }>({
      op: "catchall.get", token, zoneId,
    }),
  putCatchAll: (token: string, zoneId: string, body: unknown) =>
    call<unknown>({ op: "catchall.put", token, zoneId, payload: { body } }),
  dns: (token: string, zoneId: string) =>
    call<CfDnsRaw[]>({ op: "dns.list", token, zoneId }),
};
