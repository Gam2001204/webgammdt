import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin } from "@/lib/roles";
import { Shield, Building2, Users, FileText, Trophy, AlertTriangle, Wrench, Hash, TrendingUp } from "lucide-react";
import AdminNegocios from "@/components/admin/AdminNegocios";
import AdminUsuarios from "@/components/admin/AdminUsuarios";
import AdminSolicitudes from "@/components/admin/AdminSolicitudes";
import AdminRanking from "@/components/admin/AdminRanking";
import AdminSanciones from "@/components/admin/AdminSanciones";
import AdminSociedad from "@/components/admin/AdminSociedad";
import AdminVehiculos from "@/components/admin/AdminVehiculos";
import AdminDiscord from "@/components/admin/AdminDiscord";
import AdminBeneficios from "@/components/admin/AdminBeneficios";

const TABS = [
  { id: "negocios", label: "Negocios", icon: Building2 },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "solicitudes", label: "Solicitudes de Rol", icon: FileText },
  { id: "ranking", label: "Ranking & Horas", icon: Trophy },
  { id: "beneficios", label: "Beneficios", icon: TrendingUp },
  { id: "sanciones", label: "Sanciones", icon: AlertTriangle },
  { id: "sociedad", label: "Sociedad", icon: Shield },
  { id: "vehiculos", label: "Vehículos", icon: Wrench },
  { id: "discord", label: "Discord", icon: Hash },
];

export default function Admin() {
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState("negocios");

  if (!isAdmin(profile)) {
    return (
      <div className="p-6 text-center">
        <Shield size={48} className="mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400">Acceso denegado. Solo administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Shield size={22} className="text-[#FDDC03]" /> Panel de Administración
        </h1>
        <p className="text-gray-400 text-sm mt-1">Gestión completa de NorthPoint Roleplay MDT.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D0D0D] rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[#FDDC03] text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "negocios" && <AdminNegocios />}
      {activeTab === "usuarios" && <AdminUsuarios />}
      {activeTab === "solicitudes" && <AdminSolicitudes />}
      {activeTab === "ranking" && <AdminRanking />}
      {activeTab === "sanciones" && <AdminSanciones />}
      {activeTab === "sociedad" && <AdminSociedad />}
      {activeTab === "vehiculos" && <AdminVehiculos />}
      {activeTab === "discord" && <AdminDiscord />}
      {activeTab === "beneficios" && <AdminBeneficios />}
    </div>
  );
}