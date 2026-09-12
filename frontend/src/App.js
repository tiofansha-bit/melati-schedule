import { createContext, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Pegawai from "@/pages/Pegawai";
import Jadwal from "@/pages/Jadwal";
import Approval from "@/pages/Approval";
import Kalender from "@/pages/Kalender";

export const RoleContext = createContext({ role: "Kepala TU", setRole: () => {} });

export const ROLES = ["Petugas / Staf", "Kepala TU", "Kepala Puskesmas"];

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("puskesmas-role") || "Kepala TU");
  const changeRole = (r) => {
    setRole(r);
    localStorage.setItem("puskesmas-role", r);
  };

  return (
    <div className="App">
      <RoleContext.Provider value={{ role, setRole: changeRole }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="pegawai" element={<Pegawai />} />
              <Route path="jadwal" element={<Jadwal />} />
              <Route path="approval" element={<Approval />} />
              <Route path="kalender" element={<Kalender />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RoleContext.Provider>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
