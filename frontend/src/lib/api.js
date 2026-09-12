import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API });

export const STATUS_LABEL = {
  menunggu: "Menunggu Persetujuan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export const STATUS_STYLE = {
  menunggu: "bg-blue-50 text-blue-700 border-blue-200",
  disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ditolak: "bg-rose-50 text-rose-700 border-rose-200",
};

export const formatTanggal = (iso) => {
  if (!iso) return "-";
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${bulan[parseInt(m) - 1]} ${y}`;
};
