"use client";

import { useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";

const topics = [
  { key: "tujuan", label: "Apa itu PARAS?" },
  { key: "fitur", label: "Fiturnya apa saja?" },
  { key: "daftar", label: "Cara daftar" },
];

export default function LandingChat({
  chatOpen,
  messages,
  question,
  sending,
  onClose,
  onOpen,
  onQuestionChange,
  onSubmit,
  onTopicSelect,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatOpen]);

  return (
    <>
      {!chatOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-pink py-2.5 pl-2.5 pr-4 text-sm font-black text-white shadow-lg shadow-pink/30 hover:bg-pink-dark sm:bottom-6 sm:right-6"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </span>
          Tanya PARAS
        </button>
      )}

      {chatOpen && (
        <div
          role="dialog"
          aria-label="Tanya PARAS"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink text-white">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="flex-1 text-sm font-black text-foreground">Tanya PARAS</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <p
                key={`${m.from}-${i}`}
                className={`w-fit max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.from === "user"
                    ? "ml-auto rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {m.text}
              </p>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {topics.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onTopicSelect(t.key)}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-brand hover:text-brand"
              >
                {t.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex items-center gap-2 border-t border-border p-2.5"
          >
            <input
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="Tulis pertanyaan..."
              aria-label="Pertanyaan"
              className="min-w-0 flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="submit"
              disabled={!question.trim() || sending}
              aria-label="Kirim"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}