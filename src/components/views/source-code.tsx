"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Copy, FileArchive, FolderTree, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/kit";

/* Whitelist packer — mirrors FR-25: application source, config,
 * schema and README only. Never local data, keychain, logs or artefacts. */
const WHITELIST = [
  { path: "src/", files: 38, size: "164 KB", note: "React views, components, store, design tokens" },
  { path: "electron/main/", files: 12, size: "88 KB", note: "windows, tray, ipc, cloudflare client, db, zip packer" },
  { path: "electron/preload/", files: 2, size: "6 KB", note: "contextBridge expose of the typed allowlist" },
  { path: "shared/types.ts", files: 1, size: "5 KB", note: "Cloudflare + app types shared by all processes" },
  { path: "prisma/schema.prisma", files: 1, size: "3 KB", note: "Settings, AliasMeta, ActivityLog" },
  { path: "scripts/build/", files: 4, size: "11 KB", note: "electron-builder config generator" },
  { path: "package.json · tsconfig · tailwind.config.ts", files: 3, size: "4 KB", note: "build configuration" },
  { path: "README.md", files: 1, size: "9 KB", note: "setup, security model, development commands" },
];

const EXCLUDED = [
  "local SQLite database", "keychain contents", "logs", "build artefacts",
  "node_modules", ".env secrets", "ASAR internals",
];

export default function SourceCode() {
  const [packing, setPacking] = useState(false);
  const [packed, setPacked] = useState<{ files: number; size: string; at: string } | null>(null);

  const totalFiles = WHITELIST.reduce((a, w) => a + w.files, 0);

  function pack() {
    setPacking(true);
    // Whitelist packer simulation — the desktop build streams a real ZIP here.
    setTimeout(() => {
      setPacking(false);
      setPacked({ files: totalFiles, size: "294 KB", at: new Date().toLocaleTimeString() });
      toast.success("Source ZIP packed", {
        description: `${totalFiles} files · 294 KB · whitelist enforced, secrets excluded`,
      });
    }, 1100);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Source code"
        title="Download the running build's source"
        sub="The packer reads from a whitelist — application source, build configuration, schema and README. The local database, keychain contents and logs are permanently excluded."
        actions={
          <Button onClick={pack} disabled={packing} className="btn-accent h-10 gap-2 rounded-lg px-4 text-sm">
            <FileArchive className="h-4 w-4" />
            {packing ? "Packing…" : "Pack source ZIP"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* whitelist tree */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="glass-card p-0">
          <p className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3 text-xs font-semibold text-white/60">
            <FolderTree className="h-4 w-4 text-accent" /> Whitelist — packed into the ZIP
          </p>
          <div className="divide-y divide-white/[0.05]">
            {WHITELIST.map((w) => (
              <div key={w.path} className="flex items-center gap-4 px-5 py-3.5">
                <Check className="h-4 w-4 shrink-0 text-[var(--success-c)]" />
                <div className="min-w-0 flex-1">
                  <p className="addr-mono truncate text-[13px] font-semibold">{w.path}</p>
                  <p className="text-[11px] text-muted-foreground">{w.note}</p>
                </div>
                <span className="tabular shrink-0 text-[11px] text-white/35">{w.files} file{w.files === 1 ? "" : "s"} · {w.size}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          {/* excluded */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }} className="glass-card p-5">
            <p className="overline-label mb-3">Permanently excluded</p>
            <div className="flex flex-wrap gap-2">
              {EXCLUDED.map((x) => (
                <span key={x} className="rounded-full border border-[var(--danger-c)]/25 bg-[var(--danger-c)]/[0.06] px-3 py-1 text-[11px] text-[var(--danger-c)]">
                  {x}
                </span>
              ))}
            </div>
          </motion.div>

          {/* result */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.45 }} className="glass-card p-5">
            <p className="overline-label mb-3">Pack result</p>
            {packed ? (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-[var(--success-c)]">
                  <Package className="h-4 w-4" /> aliaskdesk-source-{new Date().toISOString().slice(0, 10)}.zip
                </p>
                <p className="text-xs text-muted-foreground">
                  {packed.files} files · {packed.size} · packed at {packed.at} · tree measured at pack time
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing packed yet in this session. The ZIP is identical to the tagged source in version control —
                reviewers verify no secrets and no prohibited capabilities are present.
              </p>
            )}
          </motion.div>

          {/* integrity note */}
          <div className="glass-card flex items-start gap-3 p-5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The packer never reads from inside an installed package&rsquo;s internals — it reads the repository
              checkout pinned in the About dialog. What ships in the ZIP is what the tag contains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
