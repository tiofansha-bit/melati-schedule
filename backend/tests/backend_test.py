"""Backend API tests for Puskesmas Jadwal app."""
import os
import io
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://schedule-puskesmas.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

FIXTURES = "/app/tests/fixtures"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- ROOT/RUANGAN ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200


def test_ruangan_13(s):
    r = s.get(f"{API}/ruangan")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 13
    ids = {x["id"] for x in data}
    assert "ruang-tu" in ids and "klaster-4" in ids


# ---------- PEGAWAI ----------
def test_pegawai_list_seed(s):
    r = s.get(f"{API}/pegawai")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 16
    assert all("_id" not in p for p in data)


def test_pegawai_create_and_duplicate_nip(s):
    payload = {"nip": "TEST_NIP_0001", "nama": "TEST_Uji Pegawai", "jabatan": "Staf",
               "ruangan_id": "ruang-tu", "telepon": "0800", "status_kepegawaian": "PNS"}
    r = s.post(f"{API}/pegawai", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["nama"] == payload["nama"]
    pid = created["id"]

    # duplicate NIP
    r2 = s.post(f"{API}/pegawai", json={**payload, "nama": "TEST_Dup"})
    assert r2.status_code == 409

    # GET verify
    lst = s.get(f"{API}/pegawai").json()
    assert any(p["id"] == pid for p in lst)

    # cleanup
    d = s.delete(f"{API}/pegawai/{pid}")
    assert d.status_code == 200


def test_pegawai_import_parse_xlsx(s):
    path = f"{FIXTURES}/pegawai.xlsx"
    with open(path, "rb") as f:
        r = s.post(f"{API}/pegawai/import/parse",
                   files={"file": ("pegawai.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["count"] >= 1
    assert "rows" in data


# ---------- JADWAL ----------
def test_jadwal_list_seed(s):
    r = s.get(f"{API}/jadwal")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3
    # pegawai enriched
    assert any("pegawai" in d for d in data)


def test_conflict_blocks_create(s):
    # Find seed approved jadwal today
    jlist = s.get(f"{API}/jadwal").json()
    today = date.today().isoformat()
    seed = next((j for j in jlist if j["status"] == "disetujui" and j["tanggal_mulai"] <= today <= j["tanggal_selesai"]), None)
    assert seed is not None, "seed jadwal today not found"
    pid = seed["pegawai_ids"][0]

    # attempt to create conflicting
    payload = {"nama_kegiatan": "TEST_Bentrok", "tanggal_mulai": today,
               "tanggal_selesai": today, "lokasi": "x", "pegawai_ids": [pid]}
    r = s.post(f"{API}/jadwal", json=payload)
    assert r.status_code == 409, r.text
    body = r.json()
    # HTTPException with dict detail
    assert "conflicts" in str(body)


def test_conflict_check_endpoint(s):
    jlist = s.get(f"{API}/jadwal").json()
    today = date.today().isoformat()
    seed = next((j for j in jlist if j["status"] == "disetujui" and j["tanggal_mulai"] <= today <= j["tanggal_selesai"]), None)
    pid = seed["pegawai_ids"][0]
    r = s.get(f"{API}/jadwal/conflicts/check",
              params={"pegawai_ids": pid, "tanggal_mulai": today, "tanggal_selesai": today})
    assert r.status_code == 200
    assert len(r.json()["conflicts"]) >= 1


def test_jadwal_create_approve_delete(s):
    # Pick a pegawai with no conflict today: use last seed pegawai
    peg = s.get(f"{API}/pegawai").json()
    # find pegawai in ruang-tu (Irma) unlikely to be in seed jadwal today
    target = next(p for p in peg if p.get("ruangan_id") == "ruang-tu")
    future_date = (date.today() + timedelta(days=30)).isoformat()

    payload = {"nama_kegiatan": "TEST_Rapat Koordinasi", "tanggal_mulai": future_date,
               "tanggal_selesai": future_date, "lokasi": "Aula", "pegawai_ids": [target["id"]]}
    r = s.post(f"{API}/jadwal", json=payload)
    assert r.status_code == 200, r.text
    jid = r.json()["id"]
    assert r.json()["status"] == "menunggu"

    # Approve as Petugas -> 403
    r_bad = s.post(f"{API}/jadwal/{jid}/approval", json={"aksi": "setujui", "approver": "Petugas"})
    assert r_bad.status_code == 403

    # Approve as Kepala TU
    r_ok = s.post(f"{API}/jadwal/{jid}/approval", json={"aksi": "setujui", "approver": "Kepala TU"})
    assert r_ok.status_code == 200
    assert r_ok.json()["status"] == "disetujui"

    # Cleanup
    s.delete(f"{API}/jadwal/{jid}")


def test_jadwal_reject(s):
    peg = s.get(f"{API}/pegawai").json()
    target = next(p for p in peg if p.get("ruangan_id") == "ruang-tu")
    future_date = (date.today() + timedelta(days=40)).isoformat()
    payload = {"nama_kegiatan": "TEST_Tolak", "tanggal_mulai": future_date,
               "tanggal_selesai": future_date, "lokasi": "x", "pegawai_ids": [target["id"]]}
    jid = s.post(f"{API}/jadwal", json=payload).json()["id"]
    r = s.post(f"{API}/jadwal/{jid}/approval",
               json={"aksi": "tolak", "approver": "Kepala Puskesmas", "catatan": "Test tolak"})
    assert r.status_code == 200
    assert r.json()["status"] == "ditolak"
    s.delete(f"{API}/jadwal/{jid}")


def test_jadwal_import_parse_docx(s):
    with open(f"{FIXTURES}/jadwal.docx", "rb") as f:
        r = s.post(f"{API}/jadwal/import/parse",
                   files={"file": ("jadwal.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert r.status_code == 200, r.text
    assert r.json()["count"] >= 1


def test_jadwal_import_parse_pdf(s):
    with open(f"{FIXTURES}/jadwal.pdf", "rb") as f:
        r = s.post(f"{API}/jadwal/import/parse", files={"file": ("jadwal.pdf", f, "application/pdf")})
    assert r.status_code == 200, r.text
    assert r.json()["count"] >= 1


# ---------- DASHBOARD ----------
def test_dashboard_today(s):
    today = date.today().isoformat()
    r = s.get(f"{API}/dashboard", params={"tanggal": today})
    assert r.status_code == 200
    data = r.json()
    assert data["total_pegawai"] >= 16
    assert len(data["ruangan"]) == 13
    assert data["di_dalam"] + data["di_luar"] == data["total_pegawai"] - sum(len(data["tanpa_ruangan"][k]) for k in ("di_dalam", "di_luar"))
    # today seed makes at least 2 di_luar
    assert data["di_luar"] >= 2
