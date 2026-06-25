

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin, isJefeOf, isEmpleadoOf } from "@/lib/roles";
import { Wrench, Clock, Calculator, FileText, Handshake, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import ControlHoras from "@/components/negocio/ControlHoras";
import CalculadoraNegocio from "@/components/negocio/CalculadoraNegocio";
import Convenios from "@/components/negocio/Convenios";
import Sociedad from "@/components/negocio/Sociedad";
import Sanciones from "@/components/negocio/Sanciones";
import BeneficiosNegocio from "@/components/negocio/BeneficiosNegocio";

const TABS = [
  { id: "calculadora", label: "Calculadora", icon: Calculator },
  { id: "horas", label: "Control de Horas", icon: Clock },
  { id: "beneficios", label: "Beneficios", icon: TrendingUp },
  { id: "convenios", label: "Convenios", icon: Handshake },
  { id: "sociedad", label: "Sociedad", icon: DollarSign },
  { id: "sanciones", label: "Sanciones", icon: AlertTriangle },
];

export default function Negocio() {
  const { id } = useParams();
  const { profile, user } = useUserProfile();
  const [business, setBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState("horas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, [id]);

  const loadBusiness = async () => {
    const b = await db.entities.Business.get(id);
    setBusiness(b);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#FDDC03]/30 border-t-[#FDDC03] rounded-full animate-spin" />
    </div>
  );

  if (!business) return (
    <div className="p-6 text-center text-gray-400">Negocio no encontrado.</div>
  );

  const admin = isAdmin(profile);
  const isJefe = isJefeOf(profile, business.nombre);
  const isEmpleado = isEmpleadoOf(profile, business.nombre);

  if (!admin && !isEmpleado) {
    return <div className="p-6 text-center text-gray-400">No tienes acceso a este negocio.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${business.colorHEX}20`, border: `2px solid ${business.colorHEX}` }}>
          {business.categoria === "Mecánico"
            ? <Wrench size={22} style={{ color: business.colorHEX }} />
            : <FileText size={22} style={{ color: business.colorHEX }} />
          }
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{business.nombre}</h1>
          <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{business.categoria}</span>
        </div>
        <div className="ml-auto text-xs text-gray-500 font-mono bg-[#0D0D0D] px-2 py-1 rounded">
          {business.colorHEX}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D0D0D] rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          // Hide sociedad and convenios for non-jefes
          if ((tab.id === "sociedad" || tab.id === "convenios") && !admin && !isJefe) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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

      {/* Content */}
      {activeTab === "calculadora" && <CalculadoraNegocio business={business} profile={profile} user={user} />}
      {activeTab === "horas" && <ControlHoras business={business} profile={profile} user={user} isAdmin={admin} isJefe={isJefe} />}
      {activeTab === "beneficios" && <BeneficiosNegocio business={business} />}
      {activeTab === "convenios" && <Convenios business={business} profile={profile} user={user} businesses={[]} />}
      {activeTab === "sociedad" && <Sociedad business={business} profile={profile} user={user} />}
      {activeTab === "sanciones" && <Sanciones business={business} profile={profile} user={user} isAdmin={admin} isJefe={isJefe} />}
    </div>
  );
}