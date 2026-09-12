import { useContext, useEffect, useState } from "react";
import { api, formatTanggal, STATUS_LABEL, STATUS_STYLE } from "@/lib/api";
import { RoleContext } from "@/App";
import { toast } from "sonner";
import { Check, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Menunggu" },
  { key: "disetujui", label: "Disetujui" },
  { key: "ditolak", label: "Ditolak" },
];

const APPROVERS = ["Kepala TU", "Kepala Puskesmas"];

export default function Approval() {
  const { role } = useContext(RoleContext);
  const [jadwal, setJadwal] = useState([]);
  const [tab, setTab] = useState("menunggu");
  const [rejecting, setRejecting] = useState(null);
  const [alasan, setAlasan] = useState("");

  const isApprover = APPROVERS.includes(role);

  const load = async () => {
    const res = await api.get("/jadwal");
    setJadwal(res.data);
  };
  useEffect(() => { load(); }, []);

  const filtered = tab === "semua" ? jadwal : jadwal.filter((j) => j.status === tab);

  const approve = async (j) => {
    try {
      await api.post(`/jadwal/${j.id}/approval`, { aksi: "setujui", approver: role, catatan: "" });
      toast.success(`"${j.nama_kegiatan}" disetujui oleh ${role}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyetujui");
    }
  };

  const reject = async () => {
    try {
      await api.post(`/jadwal/${rejecting.id}/approval`, { aksi: "tolak", approver: role, catatan: alasan });
      toast.success(`"${rejecting.nama_kegiatan}" ditolak`);
      setRejecting(null);
      setAlasan("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menolak");
    }
  };

  return (
    <div className="space-y-6" data-testid="approval-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Persetujuan Jadwal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Satu tahap — cukup disetujui oleh Kepala TU <span className="font-semibold">atau</span> Kepala Puskesmas
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${isApprover ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`} data-testid="approval-role-indicator">
          <ShieldCheck size={16} />
          {isApprover ? `Anda masuk sebagai ${role}` : `Peran "${role}" tidak dapat menyetujui — ganti peran di sidebar`}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" data-testid="approval-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-testid={`approval-tab-${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-emerald-600 text-white" : "bg-white border border-border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-70">
              {t.key === "semua" ? jadwal.length : jadwal.filter((j) => j.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((j) => (
          <div key={j.id} className="bg-white border border-border rounded-xl p-5 animate-fade-slide" data-testid={`approval-card-${j.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-bold text-slate-900">{j.nama_kegiatan}</h3>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[j.status]}`}>
                    {STATUS_LABEL[j.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 font-mono-code">
                  {formatTanggal(j.tanggal_mulai)}{j.tanggal_selesai !== j.tanggal_mulai ? ` – ${formatTanggal(j.tanggal_selesai)}` : ""}
                  {j.lokasi && <span className="font-body"> • {j.lokasi}</span>}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {j.pegawai?.map((p) => (
                    <span key={p.id} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">{p.nama}</span>
                  ))}
                </div>
                {j.disetujui_oleh && (
                  <p className="text-xs text-slate-400 mt-2">
                    {j.status === "disetujui" ? "Disetujui" : "Ditolak"} oleh {j.disetujui_oleh}
                    {j.catatan_approval ? ` — "${j.catatan_approval}"` : ""}
                  </p>
                )}
              </div>
              {j.status === "menunggu" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approve(j)}
                    disabled={!isApprover}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid={`approval-approve-btn-${j.id}`}
                  >
                    <Check size={15} className="mr-1" /> Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejecting(j); setAlasan(""); }}
                    disabled={!isApprover}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    data-testid={`approval-reject-btn-${j.id}`}
                  >
                    <X size={15} className="mr-1" /> Tolak
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10 bg-white border border-border rounded-xl" data-testid="approval-empty">
            Tidak ada jadwal pada kategori ini
          </p>
        )}
      </div>

      <Dialog open={!!rejecting} onOpenChange={() => setRejecting(null)}>
        <DialogContent data-testid="approval-reject-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Tolak Jadwal</DialogTitle>
            <DialogDescription className="sr-only">Formulir penolakan jadwal dengan alasan</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">"{rejecting?.nama_kegiatan}"</p>
          <Textarea
            placeholder="Alasan penolakan (opsional)"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            data-testid="approval-reject-reason"
          />
          <Button onClick={reject} className="w-full bg-rose-600 hover:bg-rose-700" data-testid="approval-reject-confirm">
            Tolak Jadwal
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
