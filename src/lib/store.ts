"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Zone,
  Rule,
  Destination,
  CatchAllRule,
  DnsRecord,
  ActivityEntry,
  ActivityKind,
  AliasMeta,
  ConnectionInfo,
  AccountSettings,
  AccentId,
} from "./types";

const cuid = () =>
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export interface JournalDraft {
  kind: ActivityKind;
  message: string;
}

interface AppState {
  onboarded: boolean;
  connection: ConnectionInfo;
  zones: Zone[];
  activeZoneId: string;
  rules: Rule[];
  destinations: Destination[];
  catchAll: Record<string, CatchAllRule>;
  dns: Record<string, DnsRecord[]>;
  aliasMeta: Record<string, AliasMeta>;
  journal: ActivityEntry[];
  settings: AccountSettings;
  lastSync: string | null;
  aliasSequence: Record<string, number>;
  getNextSequence: (prefix: string) => number;
  advanceSequence: (prefix: string, count: number) => number;

  /* onboarding */
  connectLive: (token: string, zones: Zone[]) => void;
  disconnect: () => void;
  resetAllData: () => void;

  /* zones */
  setActiveZone: (zoneId: string) => void;
  ingestZoneData: (zoneId: string, data: {
    rules: Rule[];
    destinations: Destination[];
    catchAll: CatchAllRule;
    dns: DnsRecord[];
  }) => void;

  /* rules */
  createRule: (input: {
    localPart: string;
    domain: string;
    name: string;
    targets: string[];
    isCustom?: boolean;
  }) => Rule | null;
  createRulesBulk: (inputs: {
    localPart: string;
    domain: string;
    name?: string;
    targets: string[];
  }[]) => number;
  deleteRule: (id: string) => void;
  deleteRulesBulk: (ids: string[]) => void;
  clearZoneRules: (zoneId: string) => void;
  toggleRule: (id: string) => boolean;
  setRuleEnabled: (id: string, enabled: boolean) => void;
  updateRuleTargets: (id: string, targets: string[]) => void;
  renameRule: (id: string, name: string) => void;

  /* alias meta (local only) */
  setAliasMeta: (ruleId: string, patch: Partial<AliasMeta>) => void;
  togglePin: (ruleId: string) => void;
  toggleUseLater: (ruleId: string) => void;
  toggleTag: (ruleId: string, tag: string) => void;

  /* destinations */
  addDestination: (email: string, verified: boolean) => void;
  verifyDestination: (id: string) => void;
  removeDestination: (id: string) => void;

  /* catch-all */
  setCatchAll: (zoneId: string, rule: CatchAllRule) => void;

  /* settings & journal */
  setSettings: (patch: Partial<AccountSettings>) => void;
  setAccent: (accent: AccentId) => void;
  log: (entry: JournalDraft) => void;
  clearJournal: () => void;
  markSynced: () => void;
}

const EMPTY_META: AliasMeta = { pinned: false, savedForLater: false, tags: [], note: "" };

const initialConnection: ConnectionInfo = {
  token: "",
  tokenHint: "",
  connectedAt: null,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      connection: initialConnection,
      zones: [],
      activeZoneId: "",
      rules: [],
      destinations: [],
      catchAll: {},
      dns: {},
      aliasMeta: {},
      journal: [],
      settings: { accent: "gold", confirmDeletes: true },
      lastSync: null,
      aliasSequence: {},

      getNextSequence: (prefix: string, domain?: string) => {
        const p = prefix.toLowerCase().trim() || "user";
        const d = (domain || get().zones.find((z) => z.id === get().activeZoneId)?.name || "default").toLowerCase();
        const key = `${d}:${p}`;
        return (get().aliasSequence?.[key] ?? get().aliasSequence?.[p] ?? 0) + 1;
      },

      advanceSequence: (prefix: string, count: number, domain?: string) => {
        const p = prefix.toLowerCase().trim() || "user";
        const d = (domain || get().zones.find((z) => z.id === get().activeZoneId)?.name || "default").toLowerCase();
        const key = `${d}:${p}`;
        const current = get().aliasSequence?.[key] ?? get().aliasSequence?.[p] ?? 0;
        const next = current + count;
        set((st) => ({
          aliasSequence: { ...(st.aliasSequence ?? {}), [key]: next, [p]: next },
        }));
        return current + 1;
      },

      /* ---------- onboarding ---------- */
      connectLive: (token, zones) => {
        set({
          onboarded: true,
          connection: {
            token,
            tokenHint: token.slice(-4),
            connectedAt: new Date().toISOString(),
          },
          zones,
          activeZoneId: zones[0]?.id ?? "",
          lastSync: new Date().toISOString(),
        });
        get().log({ kind: "connect", message: `Connected to Cloudflare — ${zones.length} zone${zones.length === 1 ? "" : "s"} discovered` });
      },

      disconnect: () => {
        set({
          onboarded: false,
          connection: initialConnection,
          zones: [],
          activeZoneId: "",
          rules: [],
          destinations: [],
          catchAll: {},
          dns: {},
          lastSync: null,
        });
        get().log({ kind: "disconnect", message: "Disconnected from Cloudflare — token wiped, local metadata preserved" });
      },

      resetAllData: () => {
        set({
          onboarded: false,
          connection: initialConnection,
          zones: [],
          activeZoneId: "",
          rules: [],
          destinations: [],
          catchAll: {},
          dns: {},
          aliasMeta: {},
          journal: [],
          lastSync: null,
          settings: { accent: get().settings.accent, confirmDeletes: true },
        });
      },

      /* ---------- zones ---------- */
      setActiveZone: (zoneId) => {
        const zone = get().zones.find((z) => z.id === zoneId);
        set({ activeZoneId: zoneId });
        if (zone) get().log({ kind: "zone", message: `Switched active zone to ${zone.name}` });
      },

      ingestZoneData: (zoneId, data) => {
        set((st) => {
          const others = st.rules.filter((r) => r.zoneId !== zoneId);
          return {
            rules: [...others, ...data.rules],
            destinations: data.destinations,
            catchAll: { ...st.catchAll, [zoneId]: data.catchAll },
            dns: { ...st.dns, [zoneId]: data.dns },
            lastSync: new Date().toISOString(),
          };
        });
      },

      /* ---------- rules ---------- */
      createRule: (input) => {
        const zone = get().zones.find((z) => z.name === input.domain) ?? get().zones.find((z) => z.id === get().activeZoneId);
        const zoneId = zone?.id ?? get().activeZoneId;
        const domain = zone?.name ?? input.domain;
        const dupe = get().rules.find(
          (r) => r.address.toLowerCase() === `${input.localPart}@${domain}`.toLowerCase()
        );
        if (dupe) return null;
        const rule: Rule = {
          id: cuid(),
          zoneId,
          address: `${input.localPart}@${domain}`,
          localPart: input.localPart,
          domain,
          name: input.name || `${input.localPart} rule`,
          enabled: true,
          actions: [{ type: "forward", value: input.targets }],
          priority: 10 + get().rules.filter((r) => r.zoneId === zoneId).length * 10,
          isCustom: input.isCustom ?? true,
          createdAt: new Date().toISOString(),
          modified: new Date().toISOString(),
        };
        set((st) => ({ rules: [...st.rules, rule] }));
        get().log({ kind: "create", message: `Created alias ${rule.address} → ${input.targets.join(", ")}` });
        return rule;
      },

      createRulesBulk: (inputs) => {
        if (!inputs.length) return 0;
        const domain = inputs[0].domain;
        const zone = get().zones.find((z) => z.name === domain) ?? get().zones.find((z) => z.id === get().activeZoneId);
        const zoneId = zone?.id ?? get().activeZoneId;
        const actualDomain = zone?.name ?? domain;
        const existingAddresses = new Set(get().rules.map((r) => r.address.toLowerCase()));
        const now = new Date().toISOString();
        const newRules: Rule[] = [];

        for (const input of inputs) {
          const address = `${input.localPart}@${actualDomain}`;
          if (!existingAddresses.has(address.toLowerCase())) {
            existingAddresses.add(address.toLowerCase());
            newRules.push({
              id: cuid(),
              zoneId,
              address,
              localPart: input.localPart,
              domain: actualDomain,
              name: input.name || `${input.localPart} rule`,
              enabled: true,
              actions: [{ type: "forward", value: input.targets }],
              priority: 10 + newRules.length * 10,
              createdAt: now,
              modified: now,
            });
          }
        }

        if (newRules.length > 0) {
          set((st) => ({ rules: [...newRules, ...st.rules] }));
          get().log({ kind: "create", message: `Generated ${newRules.length} aliases for ${actualDomain}` });
        }
        return newRules.length;
      },

      deleteRule: (id) => {
        const rule = get().rules.find((r) => r.id === id);
        set((st) => {
          const meta = { ...st.aliasMeta };
          delete meta[id];
          return { rules: st.rules.filter((r) => r.id !== id), aliasMeta: meta };
        });
        if (rule) get().log({ kind: "delete", message: `Deleted alias ${rule.address}` });
      },

      deleteRulesBulk: (ids) => {
        const idSet = new Set(ids);
        set((st) => {
          const meta = { ...st.aliasMeta };
          ids.forEach((id) => delete meta[id]);
          return { rules: st.rules.filter((r) => !idSet.has(r.id)), aliasMeta: meta };
        });
        get().log({ kind: "delete", message: `Deleted ${ids.length} aliases` });
      },

      clearZoneRules: (zoneId: string) => {
        const targetZone = get().zones.find((z) => z.id === zoneId);
        const targetDomain = targetZone?.name?.toLowerCase();
        set((st) => {
          const removed = st.rules.filter(
            (r) => r.zoneId === zoneId || (targetDomain && r.domain?.toLowerCase() === targetDomain)
          );
          const meta = { ...st.aliasMeta };
          removed.forEach((r) => delete meta[r.id]);
          return {
            rules: st.rules.filter((r) => !removed.includes(r)),
            aliasMeta: meta,
          };
        });
        get().log({ kind: "delete", message: `Cleared all local aliases for zone` });
      },

      toggleRule: (id) => {
        const rule = get().rules.find((r) => r.id === id);
        if (!rule) return false;
        const next = !rule.enabled;
        set((st) => ({
          rules: st.rules.map((r) =>
            r.id === id ? { ...r, enabled: next, modified: new Date().toISOString() } : r
          ),
        }));
        get().log({ kind: next ? "enable" : "disable", message: `${next ? "Enabled" : "Disabled"} ${rule.address}` });
        return next;
      },

      setRuleEnabled: (id, enabled) => {
        const rule = get().rules.find((r) => r.id === id);
        set((st) => ({
          rules: st.rules.map((r) =>
            r.id === id ? { ...r, enabled, modified: new Date().toISOString() } : r
          ),
        }));
        if (rule && rule.enabled !== enabled) {
          get().log({ kind: enabled ? "enable" : "disable", message: `${enabled ? "Enabled" : "Disabled"} ${rule.address}` });
        }
      },

      updateRuleTargets: (id, targets) => {
        const rule = get().rules.find((r) => r.id === id);
        set((st) => ({
          rules: st.rules.map((r) =>
            r.id === id ? { ...r, actions: [{ type: "forward", value: targets }], modified: new Date().toISOString() } : r
          ),
        }));
        if (rule) get().log({ kind: "update", message: `Updated forwarding for ${rule.address} → ${targets.join(", ")}` });
      },

      renameRule: (id, name) => {
        set((st) => ({
          rules: st.rules.map((r) => (r.id === id ? { ...r, name, modified: new Date().toISOString() } : r)),
        }));
      },

      /* ---------- alias meta ---------- */
      setAliasMeta: (ruleId, patch) => {
        set((st) => ({
          aliasMeta: {
            ...st.aliasMeta,
            [ruleId]: { ...EMPTY_META, ...st.aliasMeta[ruleId], ...patch },
          },
        }));
      },

      togglePin: (ruleId) => {
        const cur = get().aliasMeta[ruleId] ?? EMPTY_META;
        get().setAliasMeta(ruleId, { pinned: !cur.pinned });
        const rule = get().rules.find((r) => r.id === ruleId);
        if (rule) {
          get().log({ kind: "pin", message: `${!cur.pinned ? "Pinned" : "Unpinned"} ${rule.address}` });
        }
      },

      toggleUseLater: (ruleId) => {
        const cur = get().aliasMeta[ruleId] ?? EMPTY_META;
        const next = !cur.savedForLater;
        get().setAliasMeta(ruleId, { savedForLater: next });
        const rule = get().rules.find((r) => r.id === ruleId);
        if (rule) {
          get().log({ kind: "update", message: `${next ? "Saved for later" : "Removed from saved for later"}: ${rule.address}` });
        }
      },

      toggleTag: (ruleId, tag) => {
        const cur = get().aliasMeta[ruleId] ?? EMPTY_META;
        const has = cur.tags.includes(tag);
        get().setAliasMeta(ruleId, {
          tags: has ? cur.tags.filter((t) => t !== tag) : [...cur.tags, tag],
        });
      },

      /* ---------- destinations ---------- */
      addDestination: (email, verified) => {
        set((st) => ({
          destinations: [
            ...st.destinations,
            { id: cuid(), email, verified, createdAt: new Date().toISOString() },
          ],
        }));
        get().log({ kind: "destination", message: `Added destination ${email}${verified ? "" : " — awaiting Cloudflare verification mail"}` });
      },

      verifyDestination: (id) => {
        const dest = get().destinations.find((d) => d.id === id);
        set((st) => ({
          destinations: st.destinations.map((d) => (d.id === id ? { ...d, verified: true } : d)),
        }));
        if (dest) get().log({ kind: "destination", message: `Destination verified: ${dest.email}` });
      },

      removeDestination: (id) => {
        const dest = get().destinations.find((d) => d.id === id);
        set((st) => ({ destinations: st.destinations.filter((d) => d.id !== id) }));
        if (dest) get().log({ kind: "destination", message: `Removed destination ${dest.email}` });
      },

      /* ---------- catch-all ---------- */
      setCatchAll: (zoneId, rule) => {
        set((st) => ({ catchAll: { ...st.catchAll, [zoneId]: rule } }));
        const zone = get().zones.find((z) => z.id === zoneId);
        get().log({
          kind: "catchall",
          message: `Catch-all ${rule.enabled ? "enabled" : "disabled"} on ${zone?.name ?? "zone"}${rule.enabled ? ` → ${rule.actions[0]?.value.join(", ")}` : ""}`,
        });
      },

      /* ---------- settings & journal ---------- */
      setSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),
      setAccent: (accent) => set((st) => ({ settings: { ...st.settings, accent } })),
      log: (draft) =>
        set((st) => ({
          journal: [
            { id: cuid(), at: new Date().toISOString(), ...draft },
            ...st.journal,
          ].slice(0, 500),
        })),
      clearJournal: () => {
        set({ journal: [] });
      },
      markSynced: () => set({ lastSync: new Date().toISOString() }),
    }),
    {
      name: "aliaskdesk-obsidian-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (st) => ({
        onboarded: st.onboarded,
        connection: st.connection,
        zones: st.zones,
        activeZoneId: st.activeZoneId,
        rules: st.rules,
        destinations: st.destinations,
        catchAll: st.catchAll,
        dns: st.dns,
        aliasMeta: st.aliasMeta,
        journal: st.journal,
        settings: st.settings,
        lastSync: st.lastSync,
      }),
    }
  )
);

/* Selectors */
export const useActiveZone = () =>
  useApp((st) => st.zones.find((z) => z.id === st.activeZoneId));

export const metaOf = (meta: Record<string, AliasMeta>, id: string): AliasMeta =>
  meta[id] ?? EMPTY_META;

export { EMPTY_META };
