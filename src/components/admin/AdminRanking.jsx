

import { useState, useEffect } from "react";

import { formatDate, getWeekKey } from "@/lib/constants";
import { Trophy, Building2, Users, ChevronRight, ArrowLeft, Calendar } from "lucide-react";

const formatHours = (h) => {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours}h ${mins}m`;
};

// Generate list of last N weeks
const getWeekOptions = (n = 8) => {
  const weeks = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d);
    const label = i === 0 ? `Esta semana (${key})` : `Semana del ${key}`;
    weeks.push({ key, label });
  }
  return weeks;
};

export default function AdminRanking() {
  const [businesses, setBusinesses] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [view, setView] = useState("negocios");
  const [weekFilter, setWeekFilter] = useState("all");
  const weekOptions = getWeekOptions(8);

  useEffect(() => {
    Promise.all([
      db.entities.Business.filter({ activo: true }),
      db.entities.ServiceShift.list("-entrada", 1000),
    ]).then(([b, s]) => { setBusinesses(b); setAllShifts(s); });
  }, []);

  const calcDuration = (shift) => {
    const end = shift.salida ? new Date(shift.salida) : new Date();
    return Math.max(0, (end - new Date(shift.entrada)) / 3600000);
  };

  const filteredShifts = weekFilter === "all"
    ? allShifts
    : allShifts.filter(s => s.semana === weekFilter);

  // Business ranking
  const businessRanking = businesses.map(b => {
    const bShifts = filteredShifts.filter(s => s.businessId === b.id);
    const totalHours = bShifts.reduce((sum, s) => sum + calcDuration(s), 0);
    return { ...b, totalHours };
  }).sort((a, b) => b.totalHours - a.totalHours);

  // Employee ranking
  const employeeMap = {};
  filteredShifts.forEach(s => {
    if (!s.userNombreIC) return;
    if (!employeeMap[s.userNombreIC]) employeeMap[s.userNombreIC] = { nombre: s.userNombreIC, totalHours: 0, discord: s.userNombreDiscord };
    employeeMap[s.userNombreIC].totalHours += calcDuration(s);
  });
  const employeeRanking = Object.values(employeeMap).sort((a, b) => b.totalHours - a.totalHours);

  // Business detail shifts
  const businessShifts = selectedBusiness
    ? filteredShifts.filter(s => s.businessId === selectedBusiness.id).sort((a, b) => new Date(b.entrada) - new Date(a.entrada))
    : [];

  return (
    <div className="space-y-4">
      {/* Week filter */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-gray-400" />
        <select
          value={weekFilter}
          onChange={e => setWeekFilter(e.target.value)}
          className="bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
        >
          <option value="all">Todo el tiempo</option>
          {weekOptions.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setView("negocios")} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "negocios" ? "bg-[#FDDC03] text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>
          <Building2 size={13} className="inline mr-1" /> Ranking Negocios
        </button>
        <button onClick={() => setView("empleados")} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "empleados" ? "bg-[#FDDC03] text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>
          <Users size={13} className="inline mr-1" /> Ranking Empleados
        </button>
      </div>

      {view === "negocios" && !selectedBusiness && (
        <div className="space-y-2">
          {businessRanking.map((b, i) => (
            <div key={b.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/30 transition-colors" onClick={() => { setSelectedBusiness(b); setView("detalle"); }}>
              <span className={`text-xl font-black w-8 ${i === 0 ? "text-[#FDDC03]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>{i + 1}</span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.colorHEX }} />
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{b.nombre}</p>
                <p className="text-gray-500 text-xs">{b.categoria}</p>
              </div>
              <div className="text-right">
                <p className="text-[#FDDC03] font-mono font-bold">{formatHours(b.totalHours)}</p>
                <p className="text-gray-500 text-xs">totales</p>
              </div>
              <ChevronRight size={14} className="text-gray-500" />
            </div>
          ))}
          {businessRanking.length === 0 && <p className="text-gray-500 text-center py-8">No hay datos de horas.</p>}
        </div>
      )}

      {view === "detalle" && selectedBusiness && (
        <div className="space-y-3">
          <button onClick={() => { setSelectedBusiness(null); setView("negocios"); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Volver al ranking
          </button>
          <h3 className="text-white font-bold text-lg" style={{ color: selectedBusiness.colorHEX }}>{selectedBusiness.nombre}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {businessShifts.map(s => (
              <div key={s.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-sm">
                <span className="text-white font-medium w-36 truncate">{s.userNombreIC}</span>
                <span className="text-green-400 text-xs">↑ {formatDate(s.entrada)}</span>
                {s.salida ? <span className="text-red-400 text-xs">↓ {formatDate(s.salida)}</span> : <span className="text-[#FDDC03] text-xs font-bold">● Activo</span>}
                <span className="ml-auto text-[#FDDC03] font-mono text-xs font-bold">{formatHours(calcDuration(s))}</span>
              </div>
            ))}
            {businessShifts.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin fichajes.</p>}
          </div>
        </div>
      )}

      {view === "empleados" && (
        <div className="space-y-2">
          {employeeRanking.map((emp, i) => (
            <div key={emp.nombre} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <span className={`text-xl font-black w-8 ${i === 0 ? "text-[#FDDC03]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>{i + 1}</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{emp.nombre}</p>
                {emp.discord && <p className="text-gray-500 text-xs">@{emp.discord}</p>}
              </div>
              <div className="text-right">
                <p className="text-[#FDDC03] font-mono font-bold">{formatHours(emp.totalHours)}</p>
                <p className="text-gray-500 text-xs">totales</p>
              </div>
            </div>
          ))}
          {employeeRanking.length === 0 && <p className="text-gray-500 text-center py-8">No hay datos de horas.</p>}
        </div>
      )}
    </div>
  );
}