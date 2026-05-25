"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  { href: "/employees", icon: "🏢", label: "Karyawan" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

type UserRole = {
  role: string;
  business_unit: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email ?? null);
      setUserName(user.user_metadata?.full_name ?? user.email ?? null);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, business_unit")
        .eq("user_id", user.id)
        .single();
      if (roleData) setUserRole(roleData);

      if (roleData && ["owner","super_admin","admin"].includes(roleData.role)) {
        const { count } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "pending");
        setPendingCount(count ?? 0);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    super_admin: "Super Admin",
    admin: "Admin",
    manager_fnb: "Manager F&B",
    manager_nf: "Manager NF",
    manager_general: "Manager General",
    kasir_fnb: "Kasir F&B",
    dapur_fnb: "Dapur F&B",
    gudang_fnb: "Gudang F&B",
    waiters_fnb: "Waiters F&B",
    cs_staff: "CS Staff",
    packing_nf: "Packing NF",
    marketplace_nf: "Marketplace NF",
    content_creator: "Content Creator",
    ads_admin: "Ads Admin",
    finance_staff: "Finance Staff",
    hr_staff: "HR Staff",
    driver: "Driver",
    staff: "Staff",
  };

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
            className={`nav-item relative ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {item.href === "/employees" && pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        {userEmail ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(userName ?? userEmail).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{userName ?? userEmail}</p>
                {userRole && (
                  <p className="text-gray-400 text-xs truncate">
                    {ROLE_LABELS[userRole.role] ?? userRole.role} · {userRole.business_unit}
                  </p>
                )}
              </div>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
                <Link
                  href="/settings?tab=profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <span>👤</span> Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <span>🚪</span> Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            <p className="text-gray-500 text-xs">© 2025 NF3 Authentic</p>
          </div>
        )}
      </div>
    </aside>
  );
}