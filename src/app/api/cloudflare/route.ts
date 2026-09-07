import { NextRequest, NextResponse } from "next/server";

/* ============================================================
 * Cloudflare API v4 proxy — mirrors the PRD's main-process
 * client: token injected server-side, strict endpoint
 * allowlist, 20s timeout, mapped error taxonomy.
 * ============================================================ */

const CF_BASE = "https://api.cloudflare.com/client/v4";
const TIMEOUT_MS = 20_000;

/* Endpoint allowlist — everything else rejected at the boundary */
const ALLOWED_OPS = new Set([
  "zones.list",
  "rules.list",
  "rules.create",
  "rules.delete",
  "rules.update",
  "destinations.list",
  "catchall.get",
  "catchall.put",
  "dns.list",
]);

interface CfEnvelope {
  success: boolean;
  errors: { code: number; message: string }[];
  result?: unknown;
}

function mapError(status: number, cfErrors: { code: number; message: string }[]): {
  kind: string; message: string;
} {
  const code = cfErrors[0]?.code ?? 0;
  const msg = cfErrors[0]?.message ?? "Unknown Cloudflare error";
  if (code === 9106 || /missing required|malformed/i.test(msg)) {
    return { kind: "malformed_token", message: "That token does not look like a valid Cloudflare API token." };
  }
  if (status === 401 || status === 403 || code === 9109 || code === 10000) {
    return { kind: "unauthorized", message: "This token was rejected — check its permissions (Zone → Email Routing Addresses → Read, plus Email Routing Rules → Edit) and expiry." };
  }
  if (status === 429 || code === 429) {
    return { kind: "rate_limited", message: "Cloudflare is rate limiting this token. Wait a moment and retry." };
  }
  if (status === 404) {
    return { kind: "not_found", message: "The requested Cloudflare resource was not found for this token." };
  }
  if (status === 400) {
    return { kind: "validation", message: msg };
  }
  return { kind: "unknown", message: msg };
}

async function cfFetch(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<{ status: number; env: CfEnvelope | null; networkErr?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${CF_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
    const env = (await res.json().catch(() => null)) as CfEnvelope | null;
    return { status: res.status, env };
  } catch (e) {
    return {
      status: 0,
      env: null,
      networkErr: e instanceof Error ? e.message : "network error",
    };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  let body: { op?: string; token?: string; zoneId?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, err: { kind: "validation", message: "Invalid request body" } }, { status: 400 });
  }

  const { op, token, zoneId, payload } = body;
  if (!op || !ALLOWED_OPS.has(op)) {
    return NextResponse.json({ ok: false, err: { kind: "validation", message: `Operation '${op}' is not allowlisted` } }, { status: 400 });
  }
  if (!token || typeof token !== "string" || token.length < 20) {
    return NextResponse.json({ ok: false, err: { kind: "malformed_token", message: "Paste a Cloudflare API token (usually 40+ characters)." } }, { status: 400 });
  }
  if (op !== "zones.list" && op !== "destinations.list" && !/^[a-zA-Z0-9]+$/.test(zoneId ?? "")) {
    return NextResponse.json({ ok: false, err: { kind: "validation", message: "Invalid zone id" } }, { status: 400 });
  }

  /* build path + method per op */
  let path = "";
  let method = "GET";
  let reqBody: unknown = undefined;

  switch (op) {
    case "zones.list":
      path = `/zones?per_page=50`;
      break;
    case "rules.list":
      path = `/zones/${zoneId}/email/routing/rules?per_page=100`;
      break;
    case "rules.create":
      path = `/zones/${zoneId}/email/routing/rules`;
      method = "POST";
      reqBody = payload?.body;
      break;
    case "rules.delete":
      path = `/zones/${zoneId}/email/routing/rules/${String(payload?.ruleId ?? "")}`;
      method = "DELETE";
      break;
    case "rules.update":
      path = `/zones/${zoneId}/email/routing/rules/${String(payload?.ruleId ?? "")}`;
      method = "PUT";
      reqBody = payload?.body;
      break;
    case "destinations.list":
      path = `/email/routing/addresses`;
      break;
    case "catchall.get":
      path = `/zones/${zoneId}/email/routing/rules/catch_all`;
      break;
    case "catchall.put":
      path = `/zones/${zoneId}/email/routing/rules/catch_all`;
      method = "PUT";
      reqBody = payload?.body;
      break;
    case "dns.list":
      path = `/zones/${zoneId}/dns_records?per_page=100`;
      break;
  }

  const { status, env, networkErr } = await cfFetch(token, path, { method, body: reqBody });

  if (networkErr) {
    return NextResponse.json({
      ok: false,
      err: { kind: "network", message: `Could not reach api.cloudflare.com (${networkErr}). Check your connection and retry.` },
    });
  }
  if (!env) {
    return NextResponse.json({ ok: false, err: { kind: "unknown", message: "Cloudflare returned an unreadable response." } });
  }
  if (!env.success) {
    const err = mapError(status, env.errors ?? []);
    return NextResponse.json({ ok: false, err });
  }

  return NextResponse.json({ ok: true, data: env.result });
}
