"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Company {
  id: string;
  name: string;
  contactName: string | null;
  pointOfContact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
}

type Draft = Omit<Company, "id"> & { id?: string };

const empty: Draft = {
  name: "",
  contactName: null,
  pointOfContact: null,
  phone: null,
  email: null,
  address: null,
  website: null,
  notes: null,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode =
  | { kind: "list" }
  | { kind: "detail"; id: string }
  | { kind: "edit"; draft: Draft };

export default function CompaniesDialog({ open, onOpenChange }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMode({ kind: "list" });
      setErr(null);
    }
  }, [open]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const { companies } = await res.json();
        setCompanies(companies);
      }
    } finally {
      setLoading(false);
    }
  }

  const current = mode.kind === "detail" ? companies.find((c) => c.id === mode.id) : null;

  async function save() {
    if (mode.kind !== "edit") return;
    const draft = mode.draft;
    setErr(null);
    if (!draft.name.trim()) {
      setErr("Name is required.");
      return;
    }
    const url = draft.id ? `/api/companies/${draft.id}` : "/api/companies";
    const res = await fetch(url, {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        contactName: draft.contactName ?? "",
        pointOfContact: draft.pointOfContact ?? "",
        phone: draft.phone ?? "",
        email: draft.email ?? "",
        address: draft.address ?? "",
        website: draft.website ?? "",
        notes: draft.notes ?? "",
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j.error === "string" ? j.error : "Could not save.");
      return;
    }
    const { company } = await res.json();
    await load();
    setMode({ kind: "detail", id: company.id });
  }

  async function remove(id: string) {
    if (!confirm("Delete this company?")) return;
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
      setMode({ kind: "list" });
    }
  }

  function field(
    key: Exclude<keyof Draft, "id">,
    label: string,
    type: "text" | "email" | "tel" | "url" | "textarea" = "text"
  ) {
    if (mode.kind !== "edit") return null;
    const draft = mode.draft;
    const value = (draft[key] ?? "") as string;
    const onChange = (v: string) =>
      setMode({ kind: "edit", draft: { ...draft, [key]: v } });
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        )}
      </div>
    );
  }

  function row(label: string, value: string | null) {
    if (!value) return null;
    return (
      <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm">
        <div className="text-slate-500">{label}</div>
        <div className="whitespace-pre-line text-slate-900">{value}</div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode.kind !== "list" && (
              <button
                type="button"
                onClick={() => {
                  setMode({ kind: "list" });
                  setErr(null);
                }}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <span>
              {mode.kind === "list" && "Companies"}
              {mode.kind === "detail" && (current?.name ?? "Company")}
              {mode.kind === "edit" &&
                (mode.draft.id ? `Edit ${mode.draft.name || "company"}` : "New company")}
            </span>
          </DialogTitle>
        </DialogHeader>

        {mode.kind === "list" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode({ kind: "edit", draft: { ...empty } })}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Add company
            </button>
            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {!loading && companies.length === 0 && (
              <p className="text-sm text-slate-500">No companies yet.</p>
            )}
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setMode({ kind: "detail", id: c.id })}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{c.name}</div>
                      {(c.pointOfContact || c.contactName || c.phone) && (
                        <div className="truncate text-xs text-slate-500">
                          {[c.pointOfContact || c.contactName, c.phone]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode.kind === "detail" && current && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              {row("Point of contact", current.pointOfContact)}
              {row("Contact name", current.contactName)}
              {row("Phone", current.phone)}
              {row("Email", current.email)}
              {row("Website", current.website)}
              {row("Address", current.address)}
              {row("Notes", current.notes)}
              {!current.pointOfContact &&
                !current.contactName &&
                !current.phone &&
                !current.email &&
                !current.website &&
                !current.address &&
                !current.notes && (
                  <p className="text-sm text-slate-500">
                    No company details yet — click Edit to add them.
                  </p>
                )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode({ kind: "edit", draft: { ...current } })}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => remove(current.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        )}

        {mode.kind === "edit" && (
          <div className="space-y-3">
            {field("name", "Name")}
            {field("pointOfContact", "Point of contact")}
            <div className="grid gap-3 sm:grid-cols-2">
              {field("contactName", "Contact name")}
              {field("phone", "Phone", "tel")}
              {field("email", "Email", "email")}
              {field("website", "Website", "url")}
            </div>
            {field("address", "Address", "textarea")}
            {field("notes", "Notes", "textarea")}
            {err && <p className="text-xs text-rose-600">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode.draft.id) {
                    setMode({ kind: "detail", id: mode.draft.id });
                  } else {
                    setMode({ kind: "list" });
                  }
                  setErr(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
