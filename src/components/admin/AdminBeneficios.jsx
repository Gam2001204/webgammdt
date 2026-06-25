

import { useState, useEffect } from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
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
      <p className="text-gray-400 text-xs mb-2">Semana {label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function AdminBeneficios() {
  const [reports, setReports] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [weekCount, setWeekCount] = useState(6);
  const [selectedBiz, setSelectedBiz] = useState("all");

  useEffect(() => {
    Promise.all([
      db.entities.SocietyReport.filter({ estado: "aprobado" }, "-fecha", 500),
      db.entities.Business.filter({ activo: true }),
    ]).then(([r, b]) => { setReports(r); setBusinesses(b); });
  }, []);

  const weeks = getLastNWeeks(weekCount);

  // For "all": show top 5 businesses by total profit grouped by week
  // For specific biz: show that biz week by week
  const chartData = weeks.map(week => {
    const weekReports = reports.filter(r => {
      const rWeek = getWeekKey(new Date(r.fecha));
      return rWeek === week;
    });

    const entry = { semana: week.slice(5) }; // MM-DD

    if (selectedBiz === "all") {
      businesses.forEach(b => {
        const bReports = weekReports.filter(r => r.businessId === b.id);
        const profit = bReports.reduce((sum, r) => sum + (r.dineroEstaSemana - r.dineroSemanaAnterior), 0);
        entry[b.nombre] = Math.max(0, profit);
      });
    } else {
      const bReports = weekReports.filter(r => r.businessId === selectedBiz);
      const profit = bReports.reduce((sum, r) => sum + (r.dineroEstaSemana - r.dineroSemanaAnterior), 0);
      entry["Beneficio"] = Math.max(0, profit);
    }

    return entry;
  });

  // Top businesses by total
  const bizTotals = businesses.map(b => {
    const total = reports
      .filter(r => r.businessId === b.id)
      .reduce((sum, r) => sum + Math.max(0, r.dineroEstaSemana - r.dineroSemanaAnterior), 0);
    return { ...b, total };
  }).sort((a, b) => b.total - a.total);

  const topBizColors = ["#FDDC03", "#4ECDC4", "#FF6B6B", "#96CEB4", "#DDA0DD", "#85C1E9", "#F8C471", "#82E0AA"];

  const barsToRender = selectedBiz === "all"
    ? bizTotals.slice(0, 8)
    : [{ nombre: "Beneficio", id: selectedBiz }];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <select
            value={weekCount}
            onChange={e => setWeekCount(Number(e.target.value))}
            className="bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
          >
            <option value={4}>Últimas 4 semanas</option>
            <option value={6}>Últimas 6 semanas</option>
            <option value={8}>Últimas 8 semanas</option>
            <option value={12}>Últimas 12 semanas</option>
          </select>
        </div>
        <select
          value={selectedBiz}
          onChange={e => setSelectedBiz(e.target.value)}
          className="bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
        >
          <option value="all">Todos los negocios</option>
          {businesses.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      </div>

      {/* Chart */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#FDDC03]" /> Beneficios semanales (informes aprobados)
        </h3>
        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay informes de sociedad aprobados todavía.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="semana" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
              {barsToRender.map((b, i) => (
                <Bar
                  key={b.nombre}
                  dataKey={b.nombre}
                  fill={selectedBiz === "all" ? (b.colorHEX || topBizColors[i % topBizColors.length]) : "#FDDC03"}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Rankings */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-3 text-sm">Ranking de beneficios totales</h3>
        <div className="space-y-2">
          {bizTotals.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 bg-[#0D0D0D] rounded-xl px-4 py-2.5">
              <span className={`text-sm font-black w-6 ${i === 0 ? "text-[#FDDC03]" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>{i + 1}</span>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.colorHEX }} />
              <span className="text-white text-sm flex-1">{b.nombre}</span>
              <span className="text-[#FDDC03] font-mono font-bold text-sm">{formatCurrency(b.total)}</span>
            </div>
          ))}
          {bizTotals.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos.</p>}
        </div>
      </div>
    </div>
  );
}