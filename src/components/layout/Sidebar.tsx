"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/tasks", icon: "✅", label: "Task Center" },
  { href: "/media", icon: "🎬", label: "Media Pusat" },
  { href: "/ads", icon: "📢", label: "Ads Center" },
  { href: "/leads", icon: "👥", label: "CS & Lead" },
  { href: "/products", icon: "📦", label: "Produk & Stok" },
  { href: "/finance", icon: "💰", label: "Finance" },
  { href: "/documents", icon: "📋", label: "Dokumen SOP" },
  { href: "/ai-agents", icon: "🤖", label: "AI Agents" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar w-60 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-white font-bold text-lg">NF3 Command Center</h1>
        <p className="text-gray-400 text-xs mt-1">Operational Dashboard</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">© 2025 NF3 Authentic</p>
      </div>
    </aside>
  );
}
