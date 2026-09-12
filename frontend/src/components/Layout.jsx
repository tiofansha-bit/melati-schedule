import { useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, CalendarClock, ClipboardCheck, CalendarDays, HeartPulse } from "lucide-react";
import { RoleContext, ROLES } from "@/App";

const NAV = [
  { to: "/", label: "Dashboard Ruangan", icon: LayoutDashboard, testid: "nav-dashboard", end: true },
  { to: "/pegawai", label: "Data Pegawai", icon: Users, testid: "nav-pegawai" },
  { to: "/jadwal", label: "Jadwal Kegiatan Luar", icon: CalendarClock, testid: "nav-jadwal" },
  { to: "/approval", label: "Persetujuan", icon: ClipboardCheck, testid: "nav-approval" },
  { to: "/kalender", label: "Kalender", icon: CalendarDays, testid: "nav-kalender" },
];

export default function Layout() {
  const { role, setRole } = useContext(RoleContext);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-white flex flex-col fixed inset-y-0 z-30 hidden lg:flex" data-testid="sidebar">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <HeartPulse size={22} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm leading-tight text-slate-900">SI-JADWAL LUAR</h1>
              <p className="text-xs text-slate-500">Puskesmas • Kemenkes RI</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Peran Aktif</p>
          <div className="space-y-1">
            {ROLES.map((r) => (
              <button
                key={r}
                data-testid={`role-btn-${r.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                onClick={() => setRole(r)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  role === r
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4 lg:hidden" data-testid="mobile-header">
          <div className="flex items-center gap-2 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                data-testid={`mobile-${n.testid}`}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                    isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                  }`
                }
              >
                <n.icon size={14} />
                {n.label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
