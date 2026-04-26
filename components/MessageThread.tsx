"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

interface Msg {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; role: "CUSTOMER" | "CLERK" };
}

export default function MessageThread({ holdId }: { holdId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    const res = await fetch(`/api/holds/${holdId}/messages`);
    if (res.ok) {
      const { messages } = await res.json();
      setMessages(messages);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdId]);

  async function send() {
    if (!text.trim()) return;
    const res = await fetch(`/api/holds/${holdId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((prev) => [...prev, message]);
      setText("");
    }
  }

  return (
    <div>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {loading && <p className="text-xs text-slate-500">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-slate-500">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {m.sender.firstName} {m.sender.lastName}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase text-slate-700">
                {m.sender.role}
              </span>
              <span className="text-xs text-slate-500">
                {format(new Date(m.createdAt), "MMM d, h:mma")}
              </span>
            </div>
            <div className="mt-0.5 whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={send}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
