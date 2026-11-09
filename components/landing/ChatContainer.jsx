"use client";

import { useState } from "react";

// import kb from "@/backend/documents/incoming/kb.json";
import LandingChat from "./landingChat";

// Ubah ke true setelah GEMINI_API_KEY di .env.local sudah diisi.
const CHAT_ENABLED = false;

const AWAL = "Halo! PARAS hadir. Mau tanya apa tentang PARAS?";
const ERROR_MSG = "Maaf, lagi ada gangguan. Coba lagi ya.";
const KUOTA_MSG = "Lagi banyak yang bertanya nih. Tunggu sebentar lalu coba lagi ya.";
const BELUM_AKTIF_MSG =
  "Fitur tanya jawab bebas belum aktif. Sementara itu, pilih salah satu topik di bawah ya.";

export default function ChatContainer() {
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: AWAL }]);

  // Chip topik: jawaban dari kb.json lokal, tanpa API
  const handleTopicSelect = (key) => {
    const t = kb[key];
    if (!t) return;
    setMessages((m) => [...m, { from: "user", text: t.label }, { from: "bot", text: t.answer }]);
  };

  const handleSubmit = async () => {
    const q = question.trim().slice(0, 300);
    if (!q || sending) return;
    setQuestion("");

    if (!CHAT_ENABLED) {
      setMessages((m) => [...m, { from: "user", text: q }, { from: "bot", text: BELUM_AKTIF_MSG }]);
      return;
    }

    setSending(true);
    const history = [...messages.slice(1), { from: "user", text: q }].slice(-6);

    setMessages((m) => [...m, { from: "user", text: q }, { from: "bot", text: "Sebentar ya..." }]);
    const gantiTerakhir = (text) =>
      setMessages((m) => [...m.slice(0, -1), { from: "bot", text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      if (res.status === 429) {
        gantiTerakhir(KUOTA_MSG);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      gantiTerakhir(data.text || ERROR_MSG);
    } catch (e) {
      console.error("Chat error:", e);
      gantiTerakhir(ERROR_MSG);
    } finally {
      setSending(false);
    }
  };

  return (
    <LandingChat
      chatOpen={chatOpen}
      messages={messages}
      question={question}
      sending={sending}
      onOpen={() => setChatOpen(true)}
      onClose={() => setChatOpen(false)}
      onQuestionChange={setQuestion}
      onSubmit={handleSubmit}
      onTopicSelect={handleTopicSelect}
    />
  );
}