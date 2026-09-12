import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const CHIP_STYLE = {
  menunggu: "bg-blue-50 text-blue-700 border-blue-200",
  disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ditolak: "bg-rose-50 text-rose-700 border-rose-200 line-through",
};

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Kalender() {
  const [jadwal, setJadwal] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    api.get("/jadwal").then((r) => setJadwal(r.data));
  }, []);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const todayIso = iso(new Date());

  const jadwalOn = (d) => {
    const s = iso(d);
    return jadwal.filter((j) => j.tanggal_mulai <= s && s <= j.tanggal_selesai);
  };

  return (
    <div className="space-y-6" data-testid="kalender-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Kalender Kegiatan Luar</h1>
          <p className="text-sm text-slate-500 mt-1">Warna menunjukkan status persetujuan jadwal</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors" data-testid="kalender-prev">
            <ChevronLeft size={16} />
          </button>
          <p className="font-heading font-bold text-slate-900 w-40 text-center" data-testid="kalender-month-label">
            {BULAN[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors" data-testid="kalender-next">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" /> Menunggu</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" /> Disetujui</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-200 border border-rose-300" /> Ditolak</span>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-border">
          {HARI.map((h) => (
            <div key={h} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const items = jadwalOn(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div
                key={i}
                className={`min-h-28 border-b border-r border-slate-100 p-1.5 ${!inMonth ? "bg-slate-50/50" : ""} ${iso(d) === todayIso ? "bg-emerald-50/40" : ""}`}
                data-testid={`kalender-day-${iso(d)}`}
              >
                <p className={`text-xs font-mono-code mb-1 ${!inMonth ? "text-slate-300" : iso(d) === todayIso ? "text-emerald-700 font-bold" : "text-slate-500"}`}>
                  {d.getDate()}
                </p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((j) => (
                    <div
                      key={j.id}
                      title={`${j.nama_kegiatan} — ${j.pegawai?.map((p) => p.nama).join(", ")}`}
                      className={`text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${CHIP_STYLE[j.status]}`}
                      data-testid={`kalender-chip-${j.id}`}
                    >
                      {j.nama_kegiatan}
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-slate-400 px-1">+{items.length - 3} lainnya</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
