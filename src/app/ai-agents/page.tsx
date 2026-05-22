"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Agent = {
  id: number;
  code: string;
  name: string;
  icon: string;
  description: string;
  functions: string[];
  keywords: string[];
  status: "active" | "coming_soon";
  usage_count: number;
  color: string;
};

const agents: Agent[] = [
  {
    id: 1, code: "ai_manager", name: "AI Manager / Dispatcher", icon: "🧠",
    description: "Membaca task dan menentukan AI Agent yang paling cocok secara otomatis.",
    functions: ["Auto-routing task ke agent yang tepat", "Membaca konteks dan keyword", "Koordinasi antar agent"],
    keywords: ["semua task", "routing", "dispatch"],
    status: "active", usage_count: 145, color: "bg-slate-100 border-slate-300",
  },
  {
    id: 2, code: "ai_content", name: "AI Content Creator", icon: "✍️",
    description: "Membuat caption, hook, script reels, carousel, brief visual untuk semua brand.",
    functions: ["Caption Instagram & TikTok", "Script Reels & Video", "Hook & angle iklan", "Brief desain konten"],
    keywords: ["caption", "konten", "reels", "carousel", "posting", "desain", "banner", "script"],
    status: "active", usage_count: 312, color: "bg-purple-50 border-purple-200",
  },
  {
    id: 3, code: "ai_cs", name: "AI CS & Lead Responder", icon: "💬",
    description: "Membantu balas WA/DM, follow up lead, handling komplain, tanya harga dan ongkir.",
    functions: ["Template balas WA/DM", "Script follow up lead", "Handling komplain customer", "Tanya harga & ongkir"],
    keywords: ["wa", "customer", "komplain", "chat", "follow up", "tanya harga", "tanya ongkir"],
    status: "active", usage_count: 287, color: "bg-green-50 border-green-200",
  },
  {
    id: 4, code: "ai_ads", name: "AI Ads Analyst", icon: "📊",
    description: "Membaca performa iklan, leads, budget, CTR, closing dan memberi rekomendasi optimasi.",
    functions: ["Analisa CTR & ROAS", "Rekomendasi budget", "Evaluasi creative & angle", "Laporan performa campaign"],
    keywords: ["iklan", "ads", "budget", "ctr", "campaign", "meta", "tiktok ads"],
    status: "active", usage_count: 98, color: "bg-blue-50 border-blue-200",
  },
  {
    id: 5, code: "ai_fnb_manager", name: "AI F&B Manager", icon: "🍽️",
    description: "Memahami alur operasional F&B: outlet, reservasi, menu, komplain, stok, laporan harian.",
    functions: ["Laporan omzet outlet", "Pantau stok bahan", "Handling komplain tamu", "Analisa menu terlaris"],
    keywords: ["reservasi", "outlet", "menu", "dapur", "service", "kasir", "f&b", "restoran"],
    status: "active", usage_count: 67, color: "bg-orange-50 border-orange-200",
  },
  {
    id: 6, code: "ai_nf_operations", name: "AI NF Operations Manager", icon: "🎣",
    description: "Memahami alur NF dari leads, CS, COD, packing, marketplace, pengiriman, retur.",
    functions: ["Monitor alur COD", "Cek status pengiriman", "Analisa marketplace", "Laporan packing harian"],
    keywords: ["cod", "marketplace", "packing", "resi", "pengiriman", "order nf", "shopee", "tokopedia"],
    status: "active", usage_count: 134, color: "bg-cyan-50 border-cyan-200",
  },
  {
    id: 7, code: "ai_finance", name: "AI Finance Report Analyst", icon: "💰",
    description: "Membaca omzet, biaya, pemasukan, pengeluaran, payroll dan laporan harian/mingguan.",
    functions: ["Laporan omzet harian", "Analisa pengeluaran", "Rekap payroll", "Margin & profit analysis"],
    keywords: ["omzet", "laporan", "gaji", "biaya", "pemasukan", "pengeluaran", "finance"],
    status: "active", usage_count: 89, color: "bg-emerald-50 border-emerald-200",
  },
  {
    id: 8, code: "ai_inventory", name: "AI Inventory & Stock Manager", icon: "📦",
    description: "Membaca stok F&B dan NF, deteksi stok menipis, restock, barang masuk/keluar, waste.",
    functions: ["Alert stok menipis", "Rekomendasi restock", "Catat barang masuk/keluar", "Laporan waste"],
    keywords: ["stok", "gudang", "bahan", "restock", "waste", "barang masuk", "barang keluar"],
    status: "active", usage_count: 156, color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: 9, code: "ai_sop_hr", name: "AI SOP & HR Assistant", icon: "📋",
    description: "Membantu SOP, training, aturan kerja, checklist harian, teguran, dan dokumentasi HR.",
    functions: ["Generate SOP baru", "Checklist training karyawan", "Draft teguran & sanksi", "Template aturan kerja"],
    keywords: ["sop", "training", "aturan", "karyawan", "absensi", "teguran", "hr"],
    status: "active", usage_count: 45, color: "bg-pink-50 border-pink-200",
  },
  {
    id: 10, code: "ai_data_analyst", name: "AI Data & Dashboard Analyst", icon: "📈",
    description: "Membaca data dari Supabase dan membuat ringkasan, insight, laporan, serta rekomendasi owner.",
    functions: ["Ringkasan data harian", "Insight dan tren bisnis", "Rekomendasi untuk owner", "Export laporan"],
    keywords: ["dashboard", "data", "grafik", "insight", "analisa", "ringkasan"],
    status: "active", usage_count: 203, color: "bg-indigo-50 border-indigo-200",
  },
];

export default function AIAgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  function handleChat() {
    if (!chatInput.trim() || !selected) return;
    const userMsg = { role: "user" as const, text: chatInput };
    const aiReply = {
      role: "ai" as const,
      text: `[${selected.name}] Halo! Saya siap membantu tugas yang berkaitan dengan: ${selected.functions[0]}, ${selected.functions[1]}, dan lainnya. Untuk saat ini fitur AI masih dalam pengembangan — hubungkan OpenAI API key di Settings untuk mengaktifkan.`,
    };
    setMessages([...messages, userMsg, aiReply]);
    setChatInput("");
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">AI Agents</h1>
            <p className="page-subtitle">10 AI Agent khusus untuk operasional F&B dan NF</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">⚠️ Butuh OpenAI API Key</span>
            <a href="/settings" className="btn-secondary text-sm">Hubungkan API</a>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map(agent => (
                <div key={agent.id}
                  onClick={() => { setSelected(agent); setMessages([]); }}
                  className={`card p-4 cursor-pointer border-2 transition-all hover:shadow-md ${agent.color} ${selected?.id === agent.id ? "ring-2 ring-blue-500" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{agent.name}</h3>
                        <span className="badge badge-green text-xs ml-2 shrink-0">Aktif</span>
                      </div>
                      <p className="text-slate-500 text-xs mb-2 line-clamp-2">{agent.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>🔄 {agent.usage_count}x dipakai</span>
                        <span>🔑 {agent.keywords.length} keyword</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-96 shrink-0">
            {selected ? (
              <div className="card h-full flex flex-col sticky top-6" style={{ maxHeight: "80vh" }}>
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selected.icon}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{selected.name}</h3>
                      <p className="text-xs text-slate-400">Klik chat untuk mulai</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {selected.functions.map(f => (
                      <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-48">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-300 text-xs pt-8">
                      Tanyakan sesuatu ke {selected.name}
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-100 flex gap-2">
                  <input
                    className="input-field flex-1 text-sm"
                    placeholder="Tanya sesuatu..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleChat()}
                  />
                  <button onClick={handleChat} className="btn-primary text-sm px-3">Kirim</button>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center text-slate-300">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-sm">Pilih AI Agent untuk mulai chat</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
