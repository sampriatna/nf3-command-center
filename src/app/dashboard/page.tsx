import Sidebar from "@/components/layout/Sidebar";

const kpiData = [
  { label: "Tugas Aktif", value: "12", icon: "✅", color: "text-blue-600", bg: "bg-blue-50", change: "+2 hari ini" },
  { label: "Lead Masuk", value: "18", icon: "👥", color: "text-green-600", bg: "bg-green-50", change: "+5 hari ini" },
  { label: "Closing Hari Ini", value: "6", icon: "💰", color: "text-emerald-600", bg: "bg-emerald-50", change: "Rp 4.2jt" },
  { label: "Konten Review", value: "4", icon: "🎬", color: "text-purple-600", bg: "bg-purple-50", change: "Butuh approval" },
  { label: "Stok Menipis", value: "3", icon: "📦", color: "text-orange-600", bg: "bg-orange-50", change: "Perlu restock" },
  { label: "Iklan Aktif", value: "7", icon: "📣", color: "text-pink-600", bg: "bg-pink-50", change: "Rp 850k/hari" },
];

const recentTasks = [
  { title: "Desain banner Ramadan", assignee: "Rini", status: "in_progress", due: "Hari ini", priority: "high" },
  { title: "Upload video TikTok batch 3", assignee: "Andi", status: "todo", due: "Besok", priority: "medium" },
  { title: "Follow up lead 08123xxx", assignee: "Sari", status: "in_progress", due: "Hari ini", priority: "high" },
  { title: "Update harga marketplace", assignee: "Budi", status: "done", due: "Kemarin", priority: "low" },
  { title: "Buat script konten produk baru", assignee: "Dika", status: "todo", due: "Lusa", priority: "medium" },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  todo: { label: "To Do", class: "badge-blue" },
  in_progress: { label: "In Progress", class: "badge-yellow" },
  done: { label: "Selesai", class: "badge-green" },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  high: { label: "Tinggi", class: "badge-red" },
  medium: { label: "Sedang", class: "badge-yellow" },
  low: { label: "Rendah", class: "badge-blue" },
};

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
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

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {kpiData.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center text-xl mb-3`}>
                {kpi.icon}
              </div>
              <p className="text-slate-500 text-xs font-medium">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color} mt-0.5`}>{kpi.value}</p>
              <p className="text-slate-400 text-xs mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Tugas Terbaru</h2>
            <a href="/tasks" className="text-blue-600 text-sm font-medium hover:underline">Lihat Semua →</a>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTasks.map((task, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {task.assignee[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.assignee} · Due: {task.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${priorityConfig[task.priority].class}`}>
                    {priorityConfig[task.priority].label}
                  </span>
                  <span className={`badge ${statusConfig[task.status].class}`}>
                    {statusConfig[task.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
