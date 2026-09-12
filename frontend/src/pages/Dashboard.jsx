import { useEffect, useState, useCallback } from "react";
import { api, formatTanggal } from "@/lib/api";
import { Building2, CarFront, Users, ClipboardCheck, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

function StatCard({ icon: Icon, label, value, tone, testid }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <div className="bg-white border border-border rounded-xl p-5 flex items-center gap-4 animate-fade-slide" data-testid={testid}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function PersonRow({ p, outside }) {
  return (
    <div className="flex items-start gap-2 py-1.5" data-testid={`staff-item-${p.nip || p.id}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${outside ? "bg-amber-500" : "bg-emerald-500"}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{p.nama}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {p.jabatan || "Staf"}
          {outside && p.kegiatan_luar?.length > 0 && (
            <span className="text-amber-700"> • {p.kegiatan_luar[0].kegiatan}{p.kegiatan_luar[0].lokasi ? ` @ ${p.kegiatan_luar[0].lokasi}` : ""}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (tgl) => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard", { params: { tanggal: tgl } });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tanggal);
  }, [tanggal, load]);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Dashboard Keluar-Masuk Pegawai</h1>
          <p className="text-sm text-slate-500 mt-1">
            Status keberadaan petugas per ruangan — {formatTanggal(tanggal)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-44 bg-white"
            data-testid="dashboard-date-filter"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Pegawai" value={data?.total_pegawai ?? "-"} tone="slate" testid="stat-total-pegawai" />
        <StatCard icon={Building2} label="Di Dalam Gedung" value={data?.di_dalam ?? "-"} tone="emerald" testid="stat-di-dalam" />
        <StatCard icon={CarFront} label="Tugas Luar Gedung" value={data?.di_luar ?? "-"} tone="amber" testid="stat-di-luar" />
        <StatCard icon={ClipboardCheck} label="Menunggu Approval" value={data?.menunggu_approval ?? "-"} tone="blue" testid="stat-menunggu-approval" />
      </div>

      {loading && !data ? (
        <p className="text-sm text-slate-400" data-testid="dashboard-loading">Memuat data ruangan...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.ruangan?.map((r, i) => (
            <div
              key={r.id}
              className="bg-white border border-border rounded-xl p-5 animate-fade-slide"
              style={{ animationDelay: `${i * 40}ms` }}
              data-testid={`room-card-${r.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 leading-snug">{r.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono-code mt-0.5">{r.code} • {r.category}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                  data-testid={`status-badge-inside-${r.id}`}
                >
                  {r.di_dalam.length} Di Dalam
                </span>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                  data-testid={`status-badge-outside-${r.id}`}
                >
                  {r.di_luar.length} Tugas Luar
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-44 overflow-y-auto">
                {r.di_dalam.length === 0 && r.di_luar.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">Belum ada pegawai di ruangan ini</p>
                )}
                {r.di_luar.map((p) => <PersonRow key={p.id} p={p} outside />)}
                {r.di_dalam.map((p) => <PersonRow key={p.id} p={p} />)}
              </div>
            </div>
          ))}
          {data?.tanpa_ruangan && (data.tanpa_ruangan.di_dalam.length > 0 || data.tanpa_ruangan.di_luar.length > 0) && (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-5" data-testid="room-card-tanpa-ruangan">
              <h3 className="font-heading font-bold text-sm text-slate-900 mb-3">Belum Ditugaskan ke Ruangan</h3>
              <div className="divide-y divide-slate-50">
                {data.tanpa_ruangan.di_luar.map((p) => <PersonRow key={p.id} p={p} outside />)}
                {data.tanpa_ruangan.di_dalam.map((p) => <PersonRow key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
