

import { useState, useEffect } from "react";

import { formatDate } from "@/lib/constants";
import { AlertTriangle, Plus, Send, CheckCircle, MessageSquare } from "lucide-react";
import { notifyDiscord, DISCORD_COLORS } from "@/lib/discordNotify";

const STATUS = {
  pendiente: { label: "Pendiente", color: "text-yellow-400" },
  aceptada: { label: "Aceptada", color: "text-gray-400" },
  apelada: { label: "Apelada", color: "text-blue-400" },
  apelacion_aprobada: { label: "Apelación Aprobada", color: "text-green-400" },
  apelacion_denegada: { label: "Apelación Denegada", color: "text-red-400" },
};

export default function AdminSanciones() {
  const [sanciones, setSanciones] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [respondDecision, setRespondDecision] = useState("aprobada");
  const [form, setForm] = useState({
    staffNombre: "", businessId: "", descripcion: "", tipo: "Aviso", detalleSancion: "",
  });
  const [filterBusiness, setFilterBusiness] = useState("");

  useEffect(() => {
    Promise.all([
      db.entities.Sanction.list("-fechaCreacion"),
      db.entities.Business.filter({ activo: true }),
      db.entities.UserProfile.list(),
    ]).then(([s, b, p]) => { setSanciones(s); setBusinesses(b); setProfiles(p); });
  }, []);

  const reload = async () => {
    const s = await db.entities.Sanction.list("-fechaCreacion");
    setSanciones(s);
    // Auto-accept sanctions past 48h
    const now = new Date();
    const toAutoAccept = s.filter(san =>
      san.estado === "pendiente" &&
      san.fechaLimiteApelacion &&
      new Date(san.fechaLimiteApelacion) < now
    );
    await Promise.all(toAutoAccept.map(san =>
      db.entities.Sanction.update(san.id, { estado: "aceptada" })
    ));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.businessId || !form.staffNombre || !form.descripcion) return;
    setSaving(true);
    const biz = businesses.find(b => b.id === form.businessId);
    const fechaCreacion = new Date().toISOString();
    const fechaLimite = new Date(Date.now() + 48 * 3600000).toISOString();
    await db.entities.Sanction.create({
      ...form,
      businessNombre: biz?.nombre || "",
      fechaCreacion,
      fechaLimiteApelacion: fechaLimite,
      estado: "pendiente",
    });
    notifyDiscord({
      title: `${form.tipo === "Sanción" ? "🚨" : "⚠️"} ${form.tipo} emitida`,
      description: `**Negocio:** ${biz?.nombre || form.businessId}\n**Staff:** ${form.staffNombre}\n**Motivo:** ${form.descripcion}${form.detalleSancion ? `\n**Detalle:** ${form.detalleSancion}` : ""}`,
      color: form.tipo === "Sanción" ? DISCORD_COLORS.red : DISCORD_COLORS.orange,
    });
    setForm({ staffNombre: "", businessId: "", descripcion: "", tipo: "Aviso", detalleSancion: "" });
    setShowForm(false);
    setSaving(false);
    reload();
  };

  const handleRespond = async (san) => {
    await db.entities.Sanction.update(san.id, {
      estado: `apelacion_${respondDecision}`,
      respuestaApelacion: respuesta,
    });
    notifyDiscord({
      title: respondDecision === "aprobada" ? "✅ Apelación aprobada" : "❌ Apelación denegada",
      description: `**Negocio:** ${san.businessNombre}\n**Sanción:** ${san.descripcion}\n**Respuesta:** ${respuesta || "Sin comentario"}`,
      color: respondDecision === "aprobada" ? DISCORD_COLORS.green : DISCORD_COLORS.red,
    });
    setRespondingId(null); setRespuesta(""); setRespondDecision("aprobada");
    reload();
  };

  const filtered = sanciones.filter(s => !filterBusiness || s.businessId === filterBusiness);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={filterBusiness}
          onChange={e => setFilterBusiness(e.target.value)}
          className="bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
        >
          <option value="">Todos los negocios</option>
          {businesses.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#FDDC03] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#FDDC03]/90 transition-colors"
        >
          <Plus size={14} /> Nueva Sanción
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold">Emitir Sanción</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Staff (nombre) *</label>
              <input value={form.staffNombre} onChange={e => setForm(f => ({ ...f, staffNombre: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="Tu nombre IC" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Negocio *</label>
              <select value={form.businessId} onChange={e => setForm(f => ({ ...f, businessId: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]">
                <option value="">Seleccionar...</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]">
                <option value="Aviso">Aviso</option>
                <option value="Sanción">Sanción</option>
              </select>
            </div>
            {form.tipo === "Sanción" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Detalle de la sanción *</label>
                <input value={form.detalleSancion} onChange={e => setForm(f => ({ ...f, detalleSancion: e.target.value }))} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="Especifica la sanción..." />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción *</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} required rows={3} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]" placeholder="Describe la sanción..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#FDDC03] text-black font-bold px-5 py-2 rounded-lg disabled:opacity-50"><Send size={14} />{saving ? "Enviando..." : "Emitir Sanción"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filtered.map(s => {
          const st = STATUS[s.estado] || STATUS.pendiente;
          return (
            <div key={s.id} className={`bg-[#1A1A1A] border rounded-2xl p-5 ${s.tipo === "Sanción" ? "border-red-500/20" : "border-yellow-500/20"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.tipo === "Sanción" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{s.tipo}</span>
                    <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{s.businessNombre}</p>
                  <p className="text-gray-500 text-xs">{s.staffNombre} · {formatDate(s.fechaCreacion)}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-1">{s.descripcion}</p>
              {s.detalleSancion && <p className="text-red-300 text-xs mb-1">Detalle: {s.detalleSancion}</p>}
              {s.motivoApelacion && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-2">
                  <p className="text-blue-300 text-xs"><span className="font-bold">Apelación: </span>{s.motivoApelacion}</p>
                </div>
              )}
              {s.estado === "apelada" && (
                respondingId === s.id ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <button onClick={() => setRespondDecision("aprobada")} className={`text-sm px-3 py-1 rounded-lg font-bold ${respondDecision === "aprobada" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-gray-400"}`}>Aprobar</button>
                      <button onClick={() => setRespondDecision("denegada")} className={`text-sm px-3 py-1 rounded-lg font-bold ${respondDecision === "denegada" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-gray-400"}`}>Denegar</button>
                    </div>
                    <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="Respuesta a la apelación..." rows={2} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]" />
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(s)} className="text-sm bg-[#FDDC03] text-black font-bold px-4 py-2 rounded-lg">Confirmar</button>
                      <button onClick={() => setRespondingId(null)} className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setRespondingId(s.id)} className="flex items-center gap-1.5 text-sm text-[#FDDC03] border border-[#FDDC03]/30 bg-[#FDDC03]/10 px-4 py-2 rounded-lg hover:bg-[#FDDC03]/20 font-bold mt-2">
                    <MessageSquare size={14} /> Responder Apelación
                  </button>
                )
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">No hay sanciones.</p>}
      </div>
    </div>
  );
}