

import { useState, useEffect } from "react";

import { formatDate, formatCurrency, getWeekKey } from "@/lib/constants";
import { LogIn, LogOut, Trophy, Clock } from "lucide-react";

export default function ControlHoras({ business, profile, user, isAdmin, isJefe }) {
  const [shifts, setShifts] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);

  const weekKey = getWeekKey();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [business.id]);

  const loadData = async () => {
    const [active, week, all] = await Promise.all([
      db.entities.ServiceShift.filter({ userId: user?.id, businessId: business.id, activo: true }),
      db.entities.ServiceShift.filter({ businessId: business.id, semana: weekKey }),
      (isAdmin || isJefe) ? db.entities.ServiceShift.filter({ businessId: business.id }, "-entrada", 200) : Promise.resolve([]),
    ]);
    setActiveShift(active[0] || null);
    setShifts(week);
    setAllShifts(all);
    setLoading(false);
  };

  const handleEntrada = async () => {
    setClocking(true);
    await db.entities.ServiceShift.create({
      userId: user?.id,
      userNombreIC: profile?.nombreIC || "",
      userNombreDiscord: profile?.nombreDiscord || "",
      businessId: business.id,
      businessNombre: business.nombre,
      entrada: new Date().toISOString(),
      activo: true,
      semana: weekKey,
    });
    setClocking(false);
    loadData();
  };

  const handleSalida = async () => {
    if (!activeShift) return;
    setClocking(true);
    await db.entities.ServiceShift.update(activeShift.id, {
      salida: new Date().toISOString(),
      activo: false,
    });
    setClocking(false);
    loadData();
  };

  // Calculate hours per employee this week
  const rankingMap = {};
  shifts.forEach(s => {
    if (!s.userNombreIC) return;
    const duration = s.salida
      ? (new Date(s.salida) - new Date(s.entrada)) / 3600000
      : (Date.now() - new Date(s.entrada)) / 3600000;
    rankingMap[s.userNombreIC] = (rankingMap[s.userNombreIC] || 0) + duration;
  });
  const ranking = Object.entries(rankingMap)
    .map(([nombre, horas]) => ({ nombre, horas }))
    .sort((a, b) => b.horas - a.horas);

  const formatHours = (h) => {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Fichar */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[#FDDC03]" /> Control de Servicio
        </h2>
        {activeShift ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium text-sm">● En servicio desde</p>
              <p className="text-gray-400 text-xs mt-0.5">{formatDate(activeShift.entrada)}</p>
            </div>
            <button
              onClick={handleSalida}
              disabled={clocking}
              className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 font-bold px-5 py-2.5 rounded-xl hover:bg-red-500/30 disabled:opacity-50 transition-colors"
            >
              <LogOut size={16} /> Salida
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">No estás en servicio actualmente.</p>
            <button
              onClick={handleEntrada}
              disabled={clocking}
              className="flex items-center gap-2 bg-[#FDDC03] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#FDDC03]/90 disabled:opacity-50 transition-colors"
            >
              <LogIn size={16} /> Entrada
            </button>
          </div>
        )}
      </div>

      {/* Ranking semanal (solo jefe y admin) */}
      {(isAdmin || isJefe) && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-[#FDDC03]" /> Ranking Semanal
          </h2>
          {ranking.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos esta semana.</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.nombre} className="flex items-center gap-3 bg-[#0D0D0D] rounded-xl px-4 py-3">
                  <span className={`text-lg font-black w-6 ${i === 0 ? "text-[#FDDC03]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <span className="text-white font-medium flex-1 text-sm">{r.nombre}</span>
                  <span className="text-[#FDDC03] font-mono text-sm font-bold">{formatHours(r.horas)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial (solo jefe y admin) */}
      {(isAdmin || isJefe) && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Historial de Fichajes</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allShifts.slice(0, 50).map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-[#0D0D0D] rounded-lg px-4 py-2.5 text-sm">
                <span className="text-white font-medium w-32 truncate">{s.userNombreIC}</span>
                <span className="text-green-400 text-xs">↑ {formatDate(s.entrada)}</span>
                {s.salida && <span className="text-red-400 text-xs">↓ {formatDate(s.salida)}</span>}
                {!s.salida && <span className="text-[#FDDC03] text-xs font-bold">● Activo</span>}
              </div>
            ))}
            {allShifts.length === 0 && <p className="text-gray-500 text-sm">Sin fichajes registrados.</p>}
          </div>
        </div>
      )}
    </div>
  );
}