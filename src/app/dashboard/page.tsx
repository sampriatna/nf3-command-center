"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  deadline?: string;
  assignee_name?: string;
  bu?: string;
  brand?: string;
  created_at?: string;
};

const statusConfig: Record<string, { label: string; class: string }> = {
  todo: { label: "To Do", class: "badge-blue" },
  in_progress: { label: "In Progress", class: "badge-yellow" },
  review: { label: "Review", class: "badge-orange" },
  done: { label: "Selesai", class: "badge-green" },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  high: { label: "Tinggi", class: "badge-red" },
  urgent: { label: "Urgent", class: "badge-red" },
  medium: { label: "Sedang", class: "badge-yellow" },
  low: { label: "Rendah", class: "badge-blue" },
};

export default function DashboardPage() {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [activeTasks, setActiveTasks] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [todayTasks, setTodayTasks] = useState<number | null>(null);
  const [reviewTasks, setReviewTasks] = useState<number | null>(null);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchKPIs();
    fetchRecentTasks();
  }, []);

  async function fetchKPIs() {
    setKpiLoading(true);
    try {
      const { count: activeCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "done");

      const todayStr = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "done")
        .gte("deadline", todayStr + "T00:00:00")
        .lte("deadline", todayStr + "T23:59:59");

      const { count: reviewCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "review");

      const { data: stockData } = await supabase
        .from("inventory_products")
        .select("current_stock, min_stock")
        .gt("min_stock", 0);

      const lowStockCount = stockData
        ? stockData.filter((p) => (p.current_stock ?? 0) <= p.min_stock).length
        : 0;

      setActiveTasks(activeCount ?? 0);
      setTodayTasks(todayCount ?? 0);
      setReviewTasks(reviewCount ?? 0);
      setLowStock(lowStockCount);
    } catch (e) {
      console.error("KPI fetch error:", e);
    } finally {
      setKpiLoading(false);
    }
  }

  async function fetchRecentTasks() {
    setTasksLoading(true);
    try {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, deadline, assignee_name, bu, brand, created_at")
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) setRecentTasks(data);
    } catch (e) {
      console.error("Tasks fetch error:", e);
    } finally {
      setTasksLoading(false);
    }
  }

  const kpiData = [
    {
      label: "Tugas Aktif",
      value: activeTasks !== null ? String(activeTasks) : "—",
      icon: "✅",
      color: "text-blue-600",
      bg: "bg-blue-50",
      change: kpiLoading ? "Memuat..." : `${activeTasks ?? 0} belum selesai`,
    },
    {
      label: "Deadline Hari Ini",
      value: todayTasks !== null ? String(todayTasks) : "—",
      icon: "📅",
      color: "text-red-600",
      bg: "bg-red-50",
      change: kpiLoading ? "Memuat..." : todayTasks === 0 ? "Tidak ada" : "Perlu diselesaikan",
    },
    {
      label: "Perlu Review",
      value: reviewTasks !== null ? String(reviewTasks) : "—",
      icon: "🔍",
      color: "text-purple-600",
      bg: "bg-purple-50",
      change: kpiLoading ? "Memuat..." : "Butuh approval",
    },
    {
      label: "Stok Menipis",
      value: lowStock !== null ? String(lowStock) : "—",
      icon: "📦",
      color: "text-orange-600",
      bg: "bg-orange-50",
      change: kpiLoading ? "Memuat..." : lowStock === 0 ? "Stok aman" : "Perlu restock",
    },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5">{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Halo, Sam 👋</span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center text-xl mb-3`}>
                {kpi.icon}
              </div>
              <p className="text-slate-500 text-xs font-medium">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color} mt-0.5`}>
                {kpiLoading ? (
                  <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" />
                ) : (
                  kpi.value
                )}
              </p>
              <p className="text-slate-400 text-xs mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Tugas Terbaru</h2>
            <a href="/tasks" className="text-blue-600 text-sm font-medium hover:underline">Lihat Semua →</a>
          </div>
          <div className="divide-y divide-slate-50">
            {tasksLoading ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Memuat tugas dari Supabase...</div>
            ) : recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Tidak ada tugas aktif saat ini</div>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {task.assignee_name ? task.assignee_name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-400">
                        {task.assignee_name ?? "Belum ditugaskan"}
                        {task.deadline ? ` · ${new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                        {task.bu ? ` · ${task.bu}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${priorityConfig[task.priority]?.class ?? "badge-blue"}`}>
                      {priorityConfig[task.priority]?.label ?? task.priority}
                    </span>
                    <span className={`badge ${statusConfig[task.status]?.class ?? "badge-blue"}`}>
                      {statusConfig[task.status]?.label ?? task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
