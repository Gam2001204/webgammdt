

import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin, isJefeOf, isEmpleadoOf } from "@/lib/roles";
import {
  Home, Users, Building2, Shield, Wrench, FileText,
  HandshakeIcon, DollarSign, AlertTriangle, LogOut,
  ChevronDown, ChevronRight, User, Menu, X, BookOpen
} from "lucide-react";

const WatermarkBg = () => (
  <div className="fixed inset-0 pointer-events-none z-0 flex flex-col items-center justify-center opacity-[0.03] select-none">
    <span className="text-white font-black" style={{ fontSize: "12vw", lineHeight: 1, letterSpacing: "0.05em" }}>NorthPoint</span>
    <span className="text-white font-black" style={{ fontSize: "12vw", lineHeight: 1, letterSpacing: "0.05em" }}>Roleplay</span>
  </div>
);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, businesses, loading } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessesExpanded, setBusinessesExpanded] = useState(false);

  const admin = isAdmin(profile);
  const myBusinesses = businesses?.filter(b =>
    admin || isEmpleadoOf(profile, b.nombre)
  ) || [];

  const navLinkClass = (path) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path || location.pathname.startsWith(path + "/")
        ? "bg-[#FDDC03] text-black"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = () => {
    db.auth.logout("/login");
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <img src="https://media.db.com/images/public/user_6a3ba6ad0262934f09950d74/db51529b6_image.png" alt="NorthPoint" className="w-9 h-9 object-contain" />
        <div>
          <div className="text-[#FDDC03] font-black text-sm leading-tight">NorthPoint</div>
          <div className="text-gray-400 text-xs">Roleplay MDT</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link to="/" className={navLinkClass("/")} onClick={() => setSidebarOpen(false)}>
          <Home size={16} /> Inicio
        </Link>
        <Link to="/civil" className={navLinkClass("/civil")} onClick={() => setSidebarOpen(false)}>
          <Users size={16} /> Civil
        </Link>
        <Link to="/solicitar-rol" className={navLinkClass("/solicitar-rol")} onClick={() => setSidebarOpen(false)}>
          <FileText size={16} /> Solicitar Rol
        </Link>
        <Link to="/normativa" className={navLinkClass("/normativa")} onClick={() => setSidebarOpen(false)}>
          <BookOpen size={16} /> Normativa
        </Link>

        {/* Mis negocios */}
        {myBusinesses.length > 0 && (
          <div>
            <button
              onClick={() => setBusinessesExpanded(!businessesExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-3"><Building2 size={16} /> Negocios</span>
              {businessesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {businessesExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {myBusinesses.map(b => (
                  <Link
                    key={b.id}
                    to={`/negocio/${b.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      location.pathname === `/negocio/${b.id}`
                        ? "bg-[#FDDC03]/20 text-[#FDDC03]"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.colorHEX }} />
                    {b.categoria === "Mecánico" ? <Wrench size={12} /> : null}
                    {b.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin */}
        {admin && (
          <>
            <div className="pt-2 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Administración</div>
            <Link to="/admin" className={navLinkClass("/admin")} onClick={() => setSidebarOpen(false)}>
              <Shield size={16} /> Panel Admin
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <Link to="/perfil" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 rounded-full bg-[#FDDC03]/20 flex items-center justify-center">
            <User size={14} className="text-[#FDDC03]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{profile?.nombreIC || "Mi Perfil"}</div>
            <div className="text-gray-500 text-xs truncate">{profile?.nombreDiscord || ""}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm mt-1"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white flex relative overflow-hidden">
      <WatermarkBg />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-col w-56 bg-[#0D0D0D] border-r border-white/10 relative z-10 flex-shrink-0">
        {sidebar}
      </div>

      {/* Sidebar mobile */}
      <div className={`fixed inset-y-0 left-0 w-56 bg-[#0D0D0D] border-r border-white/10 z-30 transform transition-transform lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <img src="https://media.db.com/images/public/user_6a3ba6ad0262934f09950d74/db51529b6_image.png" alt="NorthPoint" className="w-7 h-7 object-contain" />
          <span className="text-[#FDDC03] font-bold text-sm">NorthPoint MDT</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}