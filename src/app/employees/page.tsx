"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Sidebar from "@/components/layout/Sidebar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  id: string; name: string; email: string; phone?: string;
  role: string; business_unit: string; brand?: string;
  status: "active" | "inactive" | "pending";
  join_date?: string; notes?: string;
};

const ROLE_OPTIONS = ["owner","super_admin","admin","manager_fnb","manager_nf","manager_general",
  "kasir_fnb","dapur_fnb","gudang_fnb","waiters_fnb","cs_staff","packing_nf","marketplace_nf",
  "content_creator","ads_admin","finance_staff","hr_staff","driver","staff"];

const BU_OPTIONS = ["General","F&B","NF","Office"];
const BRAND_MAP: Record<string,string[]> = {
  "F&B": ["Buri Umah","Kisamen","Samtaro Express","Produksi Pusat","Gudang F&B"],
  "NF": ["CS & Lead NF","Marketplace NF","Packing & Gudang NF"],
  "General": ["General"], "Office": ["Office"],
};
const ROLE_LABELS: Record<string,string> = {
  owner:"Owner",super_admin:"Super Admin",admin:"Admin",manager_fnb:"Manager F&B",
  manager_nf:"Manager NF",manager_general:"Manager General",kasir_fnb:"Kasir F&B",
  dapur_fnb:"Dapur F&B",gudang_fnb:"Gudang F&B",waiters_fnb:"Waiters F&B",
  cs_staff:"CS Staff",packing_nf:"Packing NF",marketplace_nf:"Marketplace NF",
  content_creator:"Content Creator",ads_admin:"Ads Admin",finance_staff:"Finance Staff",
  hr_staff:"HR Staff",driver:"Driver",staff:"Staff",pending:"Pending",
};
const ROLE_COLOR: Record<string,string> = {
  owner:"bg-purple-100 text-purple-700",super_admin:"bg-red-100 text-red-700",
  admin:"bg-orange-100 text-orange-700",manager_fnb:"bg-blue-100 text-blue-700",
  manager_nf:"bg-blue-100 text-blue-700",pending:"bg-yellow-100 text-yellow-700",
};
const BU_COLOR: Record<string,string> = {
  "F&B":"bg-orange-100 text-orange-700","NF":"bg-blue-100 text-blue-700",
  "General":"bg-gray-100 text-gray-700","Office":"bg-green-100 text-green-700",
};
const STATUS_COLOR: Record<string,string> = {
  active:"bg-green-100 text-green-700",inactive:"bg-gray-100 text-gray-500",
  pending:"bg-yellow-100 text-yellow-700",
};
const EMPTY_FORM: Omit<Employee,"id"> = {
  name:"",email:"",phone:"",role:"staff",business_unit:"General",
  brand:"",status:"active",join_date:new Date().toISOString().split("T")[0],notes:"",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<Omit<Employee,"id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterBU, setFilterBU] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUsers, setPendingUsers] = useState<Array<{id:string;user_id:string;email:string;name:string;created_at:string}>>([]);
  const [activeTab, setActiveTab] = useState<"directory"|"pending">("directory");

  useEffect(() => { fetchEmployees(); fetchPendingUsers(); }, []);

  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase.from("employees").select("*").order("name");
    if (!error && data) setEmployees(data);
    setLoading(false);
  }

  async function fetchPendingUsers() {
    const { data } = await supabase.from("user_roles").select("id,user_id,email,name,created_at").eq("role","pending").order("created_at",{ascending:false});
    if (data) setPendingUsers(data);
  }

  async function handleApprove(userId: string, email: string, selectedRole: string, selectedBU: string) {
    const { error } = await supabase.from("user_roles").update({ role:selectedRole, business_unit:selectedBU, approved_at:new Date().toISOString() }).eq("user_id",userId);
    if (!error) {
      fetchPendingUsers();
      await supabase.from("employees").upsert({ email, name:email.split("@")[0], role:selectedRole, business_unit:selectedBU, status:"active" }, { onConflict:"email" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Nama dan email wajib diisi"); return; }
    setSaving(true); setError("");
    if (editId) {
      const { error } = await supabase.from("employees").update({...form,updated_at:new Date().toISOString()}).eq("id",editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("employees").insert([form]);
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchEmployees(); setSaving(false);
  }

  function openEdit(emp: Employee) {
    const { id, ...rest } = emp;
    setEditId(id); setForm({...rest}); setShowForm(true);
  }

  const filtered = employees.filter(emp => {
    const matchBU = filterBU === "All" || emp.business_unit === filterBU;
    const matchStatus = filterStatus === "All" || emp.status === filterStatus;
    const matchSearch = !searchTerm || [emp.name,emp.email,emp.role,emp.brand].join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    return matchBU && matchStatus && matchSearch;
  });

  const stats = {
    total: employees.filter(e=>e.status==="active").length,
    fnb: employees.filter(e=>e.business_unit==="F&B"&&e.status==="active").length,
    nf: employees.filter(e=>e.business_unit==="NF"&&e.status==="active").length,
    pending: pendingUsers.length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="main-content flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Employee Directory</h1>
            <p className="page-subtitle">Direktori karyawan & manajemen akses role</p>
          </div>
          <button onClick={()=>{setShowForm(true);setEditId(null);setForm(EMPTY_FORM);}} className="btn-primary">+ Tambah Karyawan</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Aktif</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 shadow-sm border border-orange-100">
            <p className="text-xs text-orange-600 mb-1">Tim F&B</p>
            <p className="text-2xl font-bold text-orange-700">{stats.fnb}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <p className="text-xs text-blue-600 mb-1">Tim NF</p>
            <p className="text-2xl font-bold text-blue-700">{stats.nf}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
            <p className="text-xs text-yellow-600 mb-1">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            {stats.pending>0&&<button onClick={()=>setActiveTab("pending")} className="text-xs text-yellow-600 underline mt-0.5">Lihat →</button>}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
          <button onClick={()=>setActiveTab("directory")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab==="directory"?"bg-white text-gray-800 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>
            👥 Directory ({employees.length})
          </button>
          <button onClick={()=>setActiveTab("pending")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${activeTab==="pending"?"bg-white text-gray-800 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>
            ⏳ Pending Approval
            {stats.pending>0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{stats.pending}</span>}
          </button>
        </div>

        {activeTab==="directory"&&(
          <>
            <div className="flex gap-3 mb-4 flex-wrap items-center">
              <input type="text" placeholder="🔍 Cari nama, email, role..." className="input-field max-w-xs py-2 text-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              <div className="flex gap-1">
                {["All",...BU_OPTIONS].map(bu=>(
                  <button key={bu} onClick={()=>setFilterBU(bu)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterBU===bu?"bg-blue-600 text-white":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>{bu}</button>
                ))}
              </div>
              <div className="flex gap-1">
                {["All","active","inactive","pending"].map(s=>(
                  <button key={s} onClick={()=>setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus===s?"bg-gray-700 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{s==="All"?"Semua Status":s}</button>
                ))}
              </div>
            </div>
            {loading&&<div className="text-center py-12 text-gray-400">Memuat data karyawan...</div>}
            {!loading&&(
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Nama","Role","Business Unit","Brand","Status","Bergabung",""].map(h=>(
                        <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(emp=>(
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{emp.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="font-medium text-gray-800">{emp.name}</p>
                              <p className="text-xs text-gray-400">{emp.email}</p>
                              {emp.phone&&<p className="text-xs text-gray-400">{emp.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLOR[emp.role]??"bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[emp.role]??emp.role}</span></td>
                        <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${BU_COLOR[emp.business_unit]??"bg-gray-100 text-gray-600"}`}>{emp.business_unit}</span></td>
                        <td className="p-4 text-gray-600 text-sm">{emp.brand??"-"}</td>
                        <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[emp.status]}`}>{emp.status}</span></td>
                        <td className="p-4 text-gray-500 text-xs">{emp.join_date?new Date(emp.join_date).toLocaleDateString("id-ID"):"-"}</td>
                        <td className="p-4"><button onClick={()=>openEdit(emp)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button></td>
                      </tr>
                    ))}
                    {filtered.length===0&&<tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">Tidak ada karyawan ditemukan</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab==="pending"&&<PendingApprovalList pendingUsers={pendingUsers} onApprove={handleApprove} onRefresh={fetchPendingUsers} />}

        {showForm&&(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{editId?"Edit Karyawan":"Tambah Karyawan Baru"}</h2>
                  <button onClick={()=>{setShowForm(false);setEditId(null);setError("");}} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                {error&&<div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label><input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nama karyawan" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input className="input-field" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@nf3.co" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">No. HP (WhatsApp)</label><input className="input-field" value={form.phone??""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="628xxxxxxxxxx" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select className="select-field" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                        {ROLE_OPTIONS.map(r=><option key={r} value={r}>{ROLE_LABELS[r]??r}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                      <select className="select-field" value={form.business_unit} onChange={e=>setForm(f=>({...f,business_unit:e.target.value,brand:""}))}>
                        {BU_OPTIONS.map(bu=><option key={bu}>{bu}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand / Divisi</label>
                      <select className="select-field" value={form.brand??""} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}>
                        <option value="">Pilih brand</option>
                        {(BRAND_MAP[form.business_unit]??[]).map(b=><option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="select-field" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as Employee["status"]}))}>
                        <option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bergabung</label><input type="date" className="input-field" value={form.join_date??""} onChange={e=>setForm(f=>({...f,join_date:e.target.value}))} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label><textarea className="input-field" rows={2} placeholder="Catatan opsional..." value={form.notes??""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={()=>{setShowForm(false);setEditId(null);setError("");}} className="btn-secondary flex-1">Batal</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?"Menyimpan...":(editId?"Simpan Perubahan":"Tambah Karyawan")}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PendingApprovalList({ pendingUsers, onApprove, onRefresh }: {
  pendingUsers: Array<{id:string;user_id:string;email:string;name:string;created_at:string}>;
  onApprove: (userId:string,email:string,role:string,bu:string)=>void;
  onRefresh: ()=>void;
}) {
  const [approvals, setApprovals] = useState<Record<string,{role:string;bu:string}>>({});
  function getApproval(uid: string) { return approvals[uid]??{role:"staff",bu:"General"}; }

  if (pendingUsers.length===0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
        <span className="text-3xl block mb-2">✅</span>
        <p className="font-medium">Tidak ada permintaan akses yang menunggu</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">{pendingUsers.length} akun menunggu persetujuan</p>
        <button onClick={onRefresh} className="text-sm text-blue-600 hover:text-blue-800">🔄 Refresh</button>
      </div>
      {pendingUsers.map(user=>{
        const a = getApproval(user.user_id);
        return (
          <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-800">{user.name||user.email}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Daftar: {new Date(user.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <select className="select-field py-1 text-sm" value={a.role} onChange={e=>setApprovals(prev=>({...prev,[user.user_id]:{...a,role:e.target.value}}))}>
                  {["staff","cs_staff","kasir_fnb","dapur_fnb","packing_nf","marketplace_nf","content_creator","finance_staff","manager_fnb","manager_nf","admin","super_admin","owner"].map(r=><option key={r} value={r}>{ROLE_LABELS[r]??r}</option>)}
                </select>
                <select className="select-field py-1 text-sm" value={a.bu} onChange={e=>setApprovals(prev=>({...prev,[user.user_id]:{...a,bu:e.target.value}}))}>
                  {["General","F&B","NF","Office"].map(bu=><option key={bu}>{bu}</option>)}
                </select>
                <button onClick={()=>onApprove(user.user_id,user.email,a.role,a.bu)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">✓ Setujui</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}