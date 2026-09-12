import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Upload, Pencil, Trash2, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { nip: "", nama: "", jabatan: "", ruangan_id: "", telepon: "", status_kepegawaian: "" };

export default function Pegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [ruangan, setRuangan] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    const [p, r] = await Promise.all([api.get("/pegawai"), api.get("/ruangan")]);
    setPegawai(p.data);
    setRuangan(r.data);
  };
  useEffect(() => { load(); }, []);

  const ruanganName = (id) => ruangan.find((r) => r.id === id)?.name || "-";

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...EMPTY, ...p }); setFormOpen(true); };

  const submit = async () => {
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    try {
      if (editing) {
        await api.put(`/pegawai/${editing.id}`, form);
        toast.success("Data pegawai diperbarui");
      } else {
        await api.post("/pegawai", form);
        toast.success("Pegawai ditambahkan");
      }
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyimpan data");
    }
  };

  const hapus = async (p) => {
    if (!window.confirm(`Hapus pegawai ${p.nama}?`)) return;
    await api.delete(`/pegawai/${p.id}`);
    toast.success("Pegawai dihapus");
    load();
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/pegawai/import/parse", fd);
      if (res.data.count === 0) { toast.error("Tidak ada data terbaca dari file"); return; }
      setPreview(res.data.rows);
      setSkipped([]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membaca file");
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const res = await api.post("/pegawai/bulk", { rows: preview });
      setSkipped(res.data.skipped);
      toast.success(`${res.data.added} pegawai berhasil diimpor`);
      if (res.data.skipped.length > 0) toast.warning(`${res.data.skipped.length} baris dilewati`);
      if (res.data.skipped.length === 0) { setImportOpen(false); setPreview(null); }
      load();
    } catch (e) {
      toast.error("Gagal mengimpor data");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="pegawai-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Data Pegawai</h1>
          <p className="text-sm text-slate-500 mt-1">{pegawai.length} pegawai terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportOpen(true); setPreview(null); setSkipped([]); }} data-testid="btn-import-pegawai">
            <Upload size={16} className="mr-2" /> Import Excel/PDF/Word
          </Button>
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700" data-testid="btn-tambah-pegawai">
            <Plus size={16} className="mr-2" /> Tambah Pegawai
          </Button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">NIP</th>
                <th className="px-5 py-3 font-semibold">Nama</th>
                <th className="px-5 py-3 font-semibold">Jabatan</th>
                <th className="px-5 py-3 font-semibold">Ruangan</th>
                <th className="px-5 py-3 font-semibold">Telepon</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pegawai.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors" data-testid={`pegawai-row-${p.nip || p.id}`}>
                  <td className="px-5 py-3 font-mono-code text-xs text-slate-600">{p.nip || "-"}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{p.nama}</td>
                  <td className="px-5 py-3 text-slate-600">{p.jabatan || "-"}</td>
                  <td className="px-5 py-3 text-slate-600">{ruanganName(p.ruangan_id)}</td>
                  <td className="px-5 py-3 text-slate-600">{p.telepon || "-"}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{p.status_kepegawaian || "-"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" data-testid={`edit-pegawai-${p.nip || p.id}`}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => hapus(p)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" data-testid={`delete-pegawai-${p.nip || p.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {pegawai.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400" data-testid="pegawai-empty">Belum ada pegawai. Tambah manual atau import dari file.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent data-testid="pegawai-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
            <DialogDescription className="sr-only">Formulir data pegawai</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="NIP / NIK" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} data-testid="pegawai-input-nip" />
            <Input placeholder="Nama Lengkap *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} data-testid="pegawai-input-nama" />
            <Input placeholder="Jabatan / Profesi" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} data-testid="pegawai-input-jabatan" />
            <Select value={form.ruangan_id} onValueChange={(v) => setForm({ ...form, ruangan_id: v })}>
              <SelectTrigger data-testid="pegawai-input-ruangan"><SelectValue placeholder="Pilih Ruangan Utama" /></SelectTrigger>
              <SelectContent>
                {ruangan.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="No Telepon / WA" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} data-testid="pegawai-input-telepon" />
            <Input placeholder="Status Kepegawaian (PNS/PPPK/Non-ASN)" value={form.status_kepegawaian} onChange={(e) => setForm({ ...form, status_kepegawaian: e.target.value })} data-testid="pegawai-input-status" />
            <Button onClick={submit} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="pegawai-form-submit">
              {editing ? "Simpan Perubahan" : "Tambah Pegawai"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl" data-testid="pegawai-import-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Import Pegawai dari File</DialogTitle>
            <DialogDescription className="sr-only">Unggah dan pratinjau data pegawai dari file</DialogDescription>
          </DialogHeader>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.docx" className="hidden" onChange={pickFile} data-testid="pegawai-import-file-input" />
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 w-full text-center hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
              data-testid="pegawai-import-dropzone"
            >
              <FileSpreadsheet size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Klik untuk memilih file</p>
              <p className="text-xs text-slate-400 mt-1">Format: .xlsx, .xls, .csv, .pdf, .docx — kolom: NIP, Nama, Jabatan, Ruangan, Telepon, Status</p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600" data-testid="pegawai-import-count">{preview.length} baris terbaca — periksa sebelum menyimpan</p>
                <button onClick={() => { setPreview(null); setSkipped([]); }} className="text-slate-400 hover:text-slate-600" data-testid="pegawai-import-reset"><X size={16} /></button>
              </div>
              <div className="max-h-64 overflow-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2">NIP</th><th className="px-3 py-2">Nama</th><th className="px-3 py-2">Jabatan</th><th className="px-3 py-2">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((r, i) => (
                      <tr key={i} data-testid={`pegawai-preview-row-${i}`}>
                        <td className="px-3 py-2 font-mono-code">{r.nip || "-"}</td>
                        <td className="px-3 py-2 font-medium">{r.nama}</td>
                        <td className="px-3 py-2">{r.jabatan || "-"}</td>
                        <td className="px-3 py-2">{r.ruangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {skipped.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 max-h-32 overflow-auto" data-testid="pegawai-import-skipped">
                  {skipped.map((s, i) => <p key={i} className="text-xs text-rose-700">• {s.nama}: {s.reason}</p>)}
                </div>
              )}
              <Button onClick={confirmImport} disabled={importing} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="pegawai-import-confirm">
                {importing ? "Mengimpor..." : `Simpan ${preview.length} Data Pegawai`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
