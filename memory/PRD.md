# PRD — SI-JADWAL LUAR PUSKESMAS

## Problem Statement (asli)
Aplikasi penyusun jadwal kegiatan luar puskesmas: tidak boleh double date setiap orang; fitur import jadwal dengan Excel, PDF, Word; dashboard keluar-masuk pegawai setiap ruangan (petugas di dalam gedung vs di luar gedung); approval Kepala Puskesmas dan Kepala TU; 13 ruangan: Ruangan TU (Klaster Manajemen), Ruang Klaster 3, Ruang Klaster 2 Ibu, Ruang Klaster 2 Anak, Ruang Imunisasi, Ruang Klaster Gigi dan Mulut, Meja Skrining, Ruang Tindakan, Ruang Laboratorium, Ruang Farmasi, Loket, Pendaftaran Antrian, Klaster 4.

## Keputusan User
- Tanpa login (peran diganti via switcher di sidebar: Petugas/Staf, Kepala TU, Kepala Puskesmas)
- Approval satu tahap: Kepala TU ATAU Kepala Puskesmas cukup
- Import dua-duanya: daftar pegawai + jadwal kegiatan luar (Excel/PDF/Word)
- Konflik tanggal: blokir total (HTTP 409, tombol simpan disabled)
- Tema terang profesional instansi kesehatan (Emerald & Slate, Plus Jakarta Sans + Work Sans)

## Arsitektur
- Backend: FastAPI + MongoDB (motor), semua route prefix /api
  - /api/ruangan (13 ruangan statis), /api/pegawai (CRUD, import/parse, bulk), /api/jadwal (CRUD, conflicts/check, import/parse, bulk, {id}/approval), /api/dashboard?tanggal=
  - Parser file: pandas/openpyxl (xlsx/xls/csv), python-docx (docx), pdfplumber (pdf, fallback clustering posisi kata untuk tabel tanpa garis)
  - Deteksi bentrok: overlap rentang tanggal per pegawai, status 'ditolak' dikecualikan; divalidasi di create/update/bulk import
  - Seed otomatis saat startup jika kosong: 16 pegawai + 3 jadwal contoh
- Frontend: React + Tailwind + shadcn/ui + sonner, halaman: Dashboard, Data Pegawai, Jadwal, Persetujuan, Kalender

## User Personas
- Petugas/Staf TU: menyusun jadwal, import file, mengelola data pegawai
- Kepala TU / Kepala Puskesmas: menyetujui/menolak jadwal kegiatan luar
- Semua peran: memantau dashboard keluar-masuk pegawai per ruangan

## Yang Sudah Diimplementasikan (12 Sep 2026)
- Dashboard per ruangan real-time dengan filter tanggal + 4 kartu statistik
- CRUD pegawai + import xlsx/xls/csv/pdf/docx dengan pratinjau & laporan baris dilewati
- CRUD jadwal kegiatan luar dengan blokir total bentrok tanggal (live check + HTTP 409)
- Import jadwal dari Excel/PDF/Word dengan deteksi bentrok per baris
- Panel persetujuan satu tahap (Kepala TU/Kepala Puskesmas), tolak dengan alasan
- Kalender bulanan berkode warna status persetujuan
- Testing: backend 13/13 pytest lulus, seluruh alur frontend lulus (iteration_1.json)

## Backlog
- P1: Filter kalender per ruangan/pegawai; modal detail kegiatan saat klik chip kalender
- P1: Ekspor jadwal/laporan ke Excel/PDF
- P2: Template file import yang bisa diunduh; notifikasi (mis. WhatsApp/email) saat approval
- P2: Riwayat/audit trail perubahan jadwal; manajemen ruangan dinamis (CRUD ruangan)
- P3: Autentikasi penuh jika nanti dibutuhkan (saat ini tanpa login sesuai permintaan)
