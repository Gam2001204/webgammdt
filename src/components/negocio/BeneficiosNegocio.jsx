

import { useState, useEffect } from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
};

const getLastNWeeks = (n = 8) => {
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d));
  }
  return weeks;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/20 rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">Semana {label}</p>
      <p className="text-[#FDDC03] font-bold text-sm">{formatCurrency(payload[0]?.value || 0)}</p>
    </div>
  );
};

export default function BeneficiosNegocio({ business }) {
  const [reports, setReports] = useState([]);
  const [weekCount, setWeekCount] = useState(6);

  useEffect(() => {
    db.entities.SocietyReport.filter({ businessId: business.id, estado: "aprobado" }, "-fecha", 200)
      .then(setReports);
  }, [business.id]);

  const weeks = getLastNWeeks(weekCount);

  const chartData = weeks.map(week => {
    const weekReports = reports.filter(r => getWeekKey(new Date(r.fecha)) === week);
    const profit = weekReports.reduce((sum, r) => sum + Math.max(0, r.dineroEstaSemana - r.dineroSemanaAnterior), 0);
    return { semana: week.slice(5), beneficio: profit };
  });

  const totalBeneficio = reports.reduce((sum, r) => sum + Math.max(0, r.dineroEstaSemana - r.dineroSemanaAnterior), 0);
  const mejorSemana = [...chartData].sort((a, b) => b.beneficio - a.beneficio)[0];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-1">Beneficio total</p>
          <p className="text-[#FDDC03] text-xl font-black">{formatCurrency(totalBeneficio)}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-1">Mejor semana</p>
          <p className="text-white font-bold">{mejorSemana?.beneficio > 0 ? formatCurrency(mejorSemana.beneficio) : "—"}</p>
          {mejorSemana?.beneficio > 0 && <p className="text-gray-500 text-xs">Sem. {mejorSemana.semana}</p>}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2 text-sm">
            <TrendingUp size={15} className="text-[#FDDC03]" /> Beneficios semanales
          </h3>
          <select
            value={weekCount}
            onChange={e => setWeekCount(Number(e.target.value))}
            className="bg-[#0D0D0D] border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FDDC03]"
          >
            <option value={4}>4 semanas</option>
            <option value={6}>6 semanas</option>
            <option value={8}>8 semanas</option>
          </select>
        </div>
        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">No hay informes de sociedad aprobados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="semana" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="beneficio" name="Beneficio" fill="#FDDC03" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}