

import { useState, useEffect } from "react";

import { formatDate } from "@/lib/constants";
import { AlertTriangle, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { notifyDiscord, DISCORD_COLORS } from "@/lib/discordNotify";

const STATUS = {
  pendiente: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  aceptada: { label: "Aceptada", color: "text-gray-400", bg: "bg-gray-400/10" },
  apelada: { label: "Apelada", color: "text-blue-400", bg: "bg-blue-400/10" },
  apelacion_aprobada: { label: "Apelación Aprobada", color: "text-green-400", bg: "bg-green-400/10" },
  apelacion_denegada: { label: "Apelación Denegada", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function Sanciones({ business, profile, user, isAdmin, isJefe }) {
  const [sanciones, setSanciones] = useState([]);
  const [appealId, setAppealId] = useState(null);
  const [appealText, setAppealText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSanciones(); }, [business.id]);

  const loadSanciones = async () => {
    const s = await db.entities.Sanction.filter({ businessId: business.id }, "-fechaCreacion");
    setSanciones(s);
  };

  const handleAppeal = async (sancion) => {
    setSaving(true);
    await db.entities.Sanction.update(sancion.id, {
      estado: "apelada",
      motivoApelacion: appealText,
    });
    notifyDiscord({
      title: "📢 Apelación enviada",
      description: `**Negocio:** ${business.nombre}\n**Jefe:** ${profile?.nombreIC || "?"}\n**Sanción:** ${sancion.descripcion}\n**Motivo de apelación:** ${appealText}`,
      color: DISCORD_COLORS.blue,
    });
    setAppealId(null); setAppealText("");
    setSaving(false);
    loadSanciones();
  };

  const now = Date.now();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <AlertTriangle size={18} className="text-[#FDDC03]" /> Sanciones
      </h2>

      {sanciones.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
          <p>No hay sanciones registradas. ¡Todo en orden!</p>
        </div>
      )}

      {sanciones.map(s => {
        const st = STATUS[s.estado] || STATUS.pendiente;
        const canAppeal = (isAdmin || isJefe) && s.estado === "pendiente" && new Date(s.fechaLimiteApelacion) > new Date();
        const timeLeft = s.fechaLimiteApelacion ? Math.max(0, new Date(s.fechaLimiteApelacion) - now) : 0;
        const hoursLeft = Math.floor(timeLeft / 3600000);
        return (
          <div key={s.id} className={`bg-[#1A1A1A] border rounded-2xl p-5 ${s.tipo === "Sanción" ? "border-red-500/30" : "border-yellow-500/30"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.tipo === "Sanción" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {s.tipo}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-white font-bold text-sm">{s.staffNombre}</p>
                <p className="text-gray-500 text-xs">{formatDate(s.fechaCreacion)}</p>
              </div>
              {s.estado === "pendiente" && timeLeft > 0 && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {hoursLeft}h para apelar
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm mb-2">{s.descripcion}</p>
            {s.detalleSancion && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-2">
                <p className="text-red-300 text-xs"><span className="font-bold">Detalle: </span>{s.detalleSancion}</p>
              </div>
            )}
            {s.motivoApelacion && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2">
                <p className="text-blue-300 text-xs"><span className="font-bold">Apelación: </span>{s.motivoApelacion}</p>
              </div>
            )}
            {s.respuestaApelacion && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
                <p className="text-gray-300 text-xs"><span className="font-bold">Respuesta Admin: </span>{s.respuestaApelacion}</p>
              </div>
            )}
            {canAppeal && (
              <>
                {appealId === s.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={appealText} onChange={e => setAppealText(e.target.value)} placeholder="Motivo de la apelación..." rows={3} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAppeal(s)} disabled={saving || !appealText.trim()} className="text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-bold hover:bg-blue-500/30 disabled:opacity-50">
                        {saving ? "Enviando..." : "Enviar Apelación"}
                      </button>
                      <button onClick={() => setAppealId(null)} className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAppealId(s.id)} className="flex items-center gap-1.5 text-sm text-blue-400 border border-blue-400/30 bg-blue-400/10 px-4 py-2 rounded-lg hover:bg-blue-400/20 font-bold mt-2 transition-colors">
                    <MessageSquare size={14} /> Apelar Sanción
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}