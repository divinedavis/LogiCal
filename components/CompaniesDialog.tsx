"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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

export default function CompaniesDialog({ open, onOpenChange }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void load();
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

  async function save() {
    if (!draft) return;
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
    setDraft(null);
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this company?")) return;
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) void load();
  }

  function field(
    key: Exclude<keyof Draft, "id">,
    label: string,
    type: "text" | "email" | "tel" | "url" | "textarea" = "text"
  ) {
    if (!draft) return null;
    const value = (draft[key] ?? "") as string;
    const onChange = (v: string) => setDraft({ ...draft, [key]: v });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Companies</DialogTitle>
        </DialogHeader>

        {draft ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {draft.id ? "Edit company" : "New company"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setErr(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            {field("name", "Name")}
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
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setDraft({ ...empty })}
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
                <li
                  key={c.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium">{c.name}</div>
                      {c.contactName && (
                        <div className="text-xs text-slate-600">{c.contactName}</div>
                      )}
                      <div className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-2">
                        {c.phone && <div>📞 {c.phone}</div>}
                        {c.email && <div className="truncate">✉ {c.email}</div>}
                        {c.address && (
                          <div className="sm:col-span-2 whitespace-pre-line">
                            📍 {c.address}
                          </div>
                        )}
                        {c.website && (
                          <div className="sm:col-span-2 truncate">🌐 {c.website}</div>
                        )}
                        {c.notes && (
                          <div className="sm:col-span-2 whitespace-pre-line text-slate-500">
                            {c.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...c })}
                        className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="rounded-md border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
