"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

export interface BrowserInfo {
  id: "chrome" | "msedge" | "brave";
  name: string;
  path: string;
  found: boolean;
}

export interface BrowserSession {
  sessionId: string;
  alias: string;
  pid: number;
  profileDir: string;
  browserName: string;
  browserType: "chrome" | "msedge" | "brave";
  startedAt: number;
  status: "active" | "destroying" | "destroyed";
}

interface BrowserSessionState {
  sessions: Record<string, BrowserSession>; // key: alias.toLowerCase()
  detectedBrowsers: BrowserInfo[];
  defaultBrowser: "chrome" | "msedge" | "brave";
  destroyedCount: number;

  setDefaultBrowser: (b: "chrome" | "msedge" | "brave") => void;
  fetchDetectedBrowsers: () => Promise<BrowserInfo[]>;
  launchSession: (
    alias: string,
    options?: { browserType?: "chrome" | "msedge" | "brave"; initialUrl?: string }
  ) => Promise<BrowserSession | null>;
  stopSession: (alias: string) => Promise<boolean>;
  destroySession: (alias: string) => Promise<boolean>;
  checkSessionRunning: (alias: string) => Promise<boolean>;
}

export const useBrowserSessions = create<BrowserSessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      detectedBrowsers: [
        { id: "chrome", name: "Google Chrome", path: "", found: true },
        { id: "msedge", name: "Microsoft Edge", path: "", found: true },
        { id: "brave", name: "Brave Browser", path: "", found: false },
      ],
      defaultBrowser: "chrome",
      destroyedCount: 0,

      setDefaultBrowser: (b) => set({ defaultBrowser: b }),

      fetchDetectedBrowsers: async () => {
        try {
          const res = await fetch("/api/browser");
          if (!res.ok) return get().detectedBrowsers;
          const data = await res.json();
          if (data.ok && Array.isArray(data.browsers)) {
            set({ detectedBrowsers: data.browsers });
            // If default is not found, select first available found browser
            const currentDefault = data.browsers.find((b: BrowserInfo) => b.id === get().defaultBrowser);
            if (!currentDefault || !currentDefault.found) {
              const firstFound = data.browsers.find((b: BrowserInfo) => b.found);
              if (firstFound) set({ defaultBrowser: firstFound.id });
            }
            return data.browsers;
          }
        } catch {
          // ignore
        }
        return get().detectedBrowsers;
      },

      launchSession: async (alias, options) => {
        const key = alias.toLowerCase().trim();

        const browserType = options?.browserType || get().defaultBrowser || "chrome";

        try {
          const res = await fetch("/api/browser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "launch",
              alias,
              browserType,
              initialUrl: options?.initialUrl || "about:blank",
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.ok) {
            toast.error("Failed to launch isolated profile", { description: data.message || "Unknown error" });
            return null;
          }

          const session: BrowserSession = {
            sessionId: data.sessionId,
            alias: key,
            pid: data.pid,
            profileDir: data.profileDir,
            browserName: data.browserName,
            browserType: data.browserType,
            startedAt: data.startedAt,
            status: "active",
          };

          set((st) => ({
            sessions: { ...st.sessions, [key]: session },
          }));

          toast.success(
            `Launched ${session.browserName} Sandbox (PID: ${session.pid})`,
            { description: "Strict disk & sync isolation active" }
          );

          return session;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          toast.error("Browser launch error", { description: msg });
          return null;
        }
      },

      stopSession: async (alias) => {
        const key = alias.toLowerCase().trim();
        const session = get().sessions[key];
        if (!session) return false;

        set((st) => ({
          sessions: {
            ...st.sessions,
            [key]: { ...session, status: "destroying" },
          },
        }));

        try {
          await fetch("/api/browser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "stop",
              pid: session.pid,
              sessionId: session.sessionId,
            }),
          });

          set((st) => {
            const next = { ...st.sessions };
            delete next[key];
            return { sessions: next };
          });

          toast.success(`Session stopped: ${alias}`, {
            description: `PID ${session.pid} terminated.`,
          });
          return true;
        } catch {
          set((st) => {
            const next = { ...st.sessions };
            delete next[key];
            return { sessions: next };
          });
          return false;
        }
      },

      destroySession: async (alias) => {
        const key = alias.toLowerCase().trim();
        const session = get().sessions[key];
        if (!session) return false;

        set((st) => ({
          sessions: {
            ...st.sessions,
            [key]: { ...session, status: "destroying" },
          },
        }));

        try {
          const res = await fetch("/api/browser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "destroy",
              pid: session.pid,
              profileDir: session.profileDir,
              sessionId: session.sessionId,
            }),
          });

          const data = await res.json();

          set((st) => {
            const next = { ...st.sessions };
            delete next[key];
            return {
              sessions: next,
              destroyedCount: (st.destroyedCount || 0) + 1,
            };
          });

          toast.success(`Zero-Trace Wipeout Complete: ${alias}`, {
            description: `PID ${session.pid} terminated & temp profile permanently erased from disk.`,
          });
          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          toast.error("Wipeout error", { description: msg });
          set((st) => {
            const next = { ...st.sessions };
            delete next[key];
            return { sessions: next };
          });
          return false;
        }
      },

      checkSessionRunning: async (alias) => {
        const key = alias.toLowerCase().trim();
        const session = get().sessions[key];
        if (!session || !session.pid) return false;

        try {
          const res = await fetch("/api/browser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "status",
              pid: session.pid,
              sessionId: session.sessionId,
            }),
          });
          const data = await res.json();
          if (data.ok && !data.running) {
            // Process closed by user
            set((st) => {
              const next = { ...st.sessions };
              delete next[key];
              return { sessions: next };
            });
            return false;
          }
          return !!data.running;
        } catch {
          return true;
        }
      },
    }),
    {
      name: "aliasdesk_browser_sessions",
    }
  )
);
