

import { useState, useEffect } from "react";

import { formatDate, formatCurrency } from "@/lib/constants";
import { DollarSign, CheckCircle, XCircle, MessageSquare } from "lucide-react";

const STATUS = {
  pendiente: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  aprobado: { label: "Aprobado", color: "text-green-400", bg: "bg-green-400/10" },
  rechazado: { label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function AdminSociedad() {
  const [reports, setReports] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filterBusiness, setFilterBusiness] = useState("");
  const [respondingId, setRespondingId] = useState(null);
  const [comentario, setComentario] = useState("");
  const [decision, setDecision] = useState("aprobado");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.SocietyReport.list("-fecha"),
      db.entities.Business.filter({ activo: true }),
    ]).then(([r, b]) => { setReports(r); setBusinesses(b); });
  }, []);

  const reload = async () => {
    const r = await db.entities.SocietyReport.list("-fecha");
    setReports(r);
  };

  const handleRespond = async (report) => {
    setProcessing(true);
    await db.entities.SocietyReport.update(report.id, {
      estado: decision,
      comentarioAdmin: comentario,
    });
    setRespondingId(null); setComentario(""); setDecision("aprobado");
    setProcessing(false);
    reload();
  };

  const filtered = reports.filter(r => !filterBusiness || r.businessId === filterBusiness);

  return (
    <div className="space-y-4">
      <select
        value={filterBusiness}
        onChange={e => setFilterBusiness(e.target.value)}
        className="bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
      >
        <option value="">Todos los negocios</option>
        {businesses.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
      </select>

      <div className="space-y-3">
        {filtered.map(r => {
          const st = STATUS[r.estado] || STATUS.pendiente;
          const diff = r.dineroEstaSemana - r.dineroSemanaAnterior;
          return (
            <div key={r.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{r.businessNombre}</p>
                  <p className="text-gray-500 text-xs">{r.jefeIC} · {formatDate(r.fecha)}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="bg-[#0D0D0D] rounded-lg p-2">
                  <p className="text-gray-500 text-xs">Semana ant.</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(r.dineroSemanaAnterior)}</p>
                </div>
                <div className="bg-[#0D0D0D] rounded-lg p-2">
                  <p className="text-gray-500 text-xs">Esta semana</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(r.dineroEstaSemana)}</p>
                </div>
                <div className="bg-[#0D0D0D] rounded-lg p-2">
                  <p className="text-gray-500 text-xs">Diferencia</p>
                  <p className={`font-bold text-sm ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>{diff >= 0 ? "+" : ""}{formatCurrency(diff)}</p>
                </div>
              </div>
              {r.fotoCaja && <img src={r.fotoCaja} alt="Caja" className="h-24 rounded-lg object-cover mb-3" />}
              {r.comentarioAdmin && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
                  <p className="text-gray-300 text-xs"><span className="font-bold text-white">Admin: </span>{r.comentarioAdmin}</p>
                </div>
              )}
              {r.estado === "pendiente" && (
                respondingId === r.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button onClick={() => setDecision("aprobado")} className={`text-sm px-3 py-1 rounded-lg font-bold ${decision === "aprobado" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-gray-400"}`}>Aprobar</button>
                      <button onClick={() => setDecision("rechazado")} className={`text-sm px-3 py-1 rounded-lg font-bold ${decision === "rechazado" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-gray-400"}`}>Rechazar</button>
                    </div>
                    <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario (opcional)..." rows={2} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]" />
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(r)} disabled={processing} className="text-sm bg-[#FDDC03] text-black font-bold px-4 py-2 rounded-lg disabled:opacity-50">Confirmar</button>
                      <button onClick={() => setRespondingId(null)} className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setRespondingId(r.id)} className="flex items-center gap-1.5 text-sm text-[#FDDC03] border border-[#FDDC03]/30 bg-[#FDDC03]/10 px-4 py-2 rounded-lg hover:bg-[#FDDC03]/20 font-bold">
                    <MessageSquare size={14} /> Revisar Informe
                  </button>
                )
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">No hay informes de sociedad.</p>}
      </div>
    </div>
  );
}