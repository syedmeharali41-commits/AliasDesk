"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BadgeCheck, Inbox, MailCheck, Plus, Send, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { CopyButton, EmptyState, SectionHeader, StatusDot } from "@/components/kit";
import { validateEmail, timeAgo } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export default function Destinations() {
  const destinations = useApp((s) => s.destinations);
  const rules = useApp((s) => s.rules);
  const addDestination = useApp((s) => s.addDestination);
  const verifyDestination = useApp((s) => s.verifyDestination);
  const removeDestination = useApp((s) => s.removeDestination);

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const verified = destinations.filter((d) => d.verified).length;
  const pending = destinations.length - verified;

  const usageOf = (email: string) =>
    rules.filter((r) => r.actions.some((a) => a.value.includes(email))).length;

  function add() {
    const err = validateEmail(email.trim());
    if (err) { setEmailErr(err); return; }
    const exists = destinations.some((d) => d.email === email.trim().toLowerCase());
    if (exists) { setEmailErr("This destination already exists."); return; }
    addDestination(email.trim().toLowerCase(), false);
    toast.success(
      <span className="addr-mono text-[13px]">{email.trim().toLowerCase()} added</span>,
      { description: "Cloudflare sends a confirmation mail — verification happens out of band." }
    );
    setEmail("");
    setAddOpen(false);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Destinations"
        title="Where your mail lands"
        sub="Managed at the Cloudflare account level. New destinations receive Cloudflare's own confirmation mail — only verified inboxes may be attached to rules."
        actions={
          <Button id="btn-add-destination" onClick={() => setAddOpen(true)} className="btn-accent h-10 gap-2 rounded-lg px-4 text-sm cursor-pointer">
            <Plus className="h-4 w-4" /> Add destination
          </Button>
        }
      />

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--success-c)]/10 text-[var(--success-c)]">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold">{verified}</p>
            <p className="text-xs text-muted-foreground">Verified — rule-ready</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 p-5">
          <span className={cn("grid h-11 w-11 place-items-center rounded-xl", pending ? "bg-[var(--warning-c)]/10 text-[var(--warning-c)]" : "bg-white/[0.04] text-white/40")}>
            {pending ? <TriangleAlert className="h-5 w-5" /> : <MailCheck className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-display text-2xl font-bold">{pending}</p>
            <p className="text-xs text-muted-foreground">{pending ? "Pending — click the mail icon once confirmed" : "Nothing pending"}</p>
          </div>
        </div>
      </div>

      {/* list */}
      {destinations.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No destinations yet"
          sub="A destination is the real mailbox your aliases forward to. Add one and confirm Cloudflare's verification mail."
          action={
            <Button id="btn-add-destination-empty" onClick={() => setAddOpen(true)} className="btn-accent mt-2 h-10 rounded-lg px-4 text-sm cursor-pointer">
              <Plus className="h-4 w-4" /> Add destination
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {destinations.map((d, i) => {
            const usage = usageOf(d.email);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={cn("glass-card flex flex-wrap items-center gap-x-4 gap-y-3 p-4", !d.verified && "border-[var(--warning-c)]/25")}
              >
                <span className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  d.verified ? "bg-[var(--success-c)]/10 text-[var(--success-c)]" : "bg-[var(--warning-c)]/10 text-[var(--warning-c)]"
                )}>
                  {d.verified ? <MailCheck className="h-4.5 w-4.5" /> : <TriangleAlert className="h-4.5 w-4.5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="addr-mono truncate text-sm font-semibold">{d.email}</p>
                    <CopyButton text={d.email} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot ok={d.verified} pulse={false} />
                    {d.verified ? `Verified · added ${timeAgo(d.createdAt)}` : "Pending verification — check the inbox for Cloudflare's mail"}
                    <span className="text-white/20">·</span>
                    <span>{usage} rule{usage === 1 ? "" : "s"} attached</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!d.verified && (
                    <Button
                      id="btn-mark-verified"
                      variant="ghost"
                      size="sm"
                      onClick={() => { verifyDestination(d.id); toast.success(`${d.email} marked verified`); }}
                      className="btn-ghosty h-8 gap-1.5 rounded-md px-2.5 text-xs font-bold text-accent border border-accent/40 bg-accent/10 hover:bg-accent/20 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Mark verified
                    </Button>
                  )}
                  {usage === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(d.id)}
                      className="h-8 gap-1.5 rounded-md px-2.5 text-xs text-white/50 hover:bg-[var(--danger-c)]/10 hover:text-[var(--danger-c)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-white/10 bg-[#0b0b0c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add destination</DialogTitle>
            <DialogDescription>
              Cloudflare will send a confirmation mail to this address. Until it is confirmed,
              the destination shows as pending and cannot be attached to new rules.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="overline-label mb-2 block">Destination mailbox</label>
            <input
              id="input-destination-email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailErr(null); }}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="you@example.com"
              className={cn("input-obsidian addr-mono w-full rounded-md px-3.5 py-2.5 text-sm", emailErr && "border-[var(--danger-c)]/60")}
            />
            {emailErr && <p className="mt-1.5 text-xs text-[var(--danger-c)]">{emailErr}</p>}
          </div>
          <Button id="btn-submit-destination" onClick={add} className="btn-accent h-10 w-full text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer">
            <Send className="h-4 w-4" /> Add & await verification
          </Button>
        </DialogContent>
      </Dialog>

      {/* remove confirm — names the address, destructive pattern */}
      <Dialog open={!!confirmRemove} onOpenChange={(v) => !v && setConfirmRemove(null)}>
        <DialogContent className="border-white/10 bg-[#0b0b0c] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remove destination?</DialogTitle>
            <DialogDescription>
              <span className="addr-mono text-foreground">{confirmRemove}</span> will be removed
              from this workspace. Rules attached to it elsewhere in Cloudflare are not modified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmRemove(null)} className="btn-ghosty h-9 px-4 text-sm">
              Keep it
            </Button>
            <Button
              onClick={() => { if (confirmRemove) { const d = destinations.find((x) => x.id === confirmRemove); if (d) removeDestination(d.id); setConfirmRemove(null); toast.success("Destination removed"); } }}
              className="h-9 bg-[var(--danger-c)] px-4 text-sm font-semibold text-black hover:brightness-110"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
