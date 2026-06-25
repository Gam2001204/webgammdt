

import { useState, useEffect } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isJefeOf, isAdmin } from "@/lib/roles";
import { formatDate } from "@/lib/constants";
import { Handshake, Plus, CheckCircle, XCircle, Clock, RotateCcw, Send } from "lucide-react";

const STATUS_LABELS = {
  pendiente: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  aceptado: { label: "Aceptado", color: "text-green-400", bg: "bg-green-400/10" },
  rechazado: { label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10" },
  devuelto: { label: "Devuelto", color: "text-orange-400", bg: "bg-orange-400/10" },
};

export default function Convenios({ business, profile, user }) {
  const [convenios, setConvenios] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    jefeDestinoNombre: "", businessDestinoId: "", fecha: "",
    aportaSolicitante: "", aportaDestino: "", firmaSolicitante: false,
  });

  const admin = isAdmin(profile);
  const isJefe = isJefeOf(profile, business.nombre);
  const canAct = admin || isJefe;

  useEffect(() => {
    loadData();
    db.entities.Business.filter({ activo: true }).then(setBusinesses);
  }, [business.id]);

  const loadData = async () => {
    const [sent, received] = await Promise.all([
      db.entities.Agreement.filter({ businessSolicitanteId: business.id }, "-created_date"),
      db.entities.Agreement.filter({ businessDestinoId: business.id }, "-created_date"),
    ]);
    const all = [...sent, ...received.filter(r => !sent.find(s => s.id === r.id))];
    all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setConvenios(all);
  };

  const resetForm = () => {
    setForm({ jefeDestinoNombre: "", businessDestinoId: "", fecha: "", aportaSolicitante: "", aportaDestino: "", firmaSolicitante: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.businessDestinoId || !form.aportaSolicitante || !form.aportaDestino) return;
    setSaving(true);
    const destBiz = businesses.find(b => b.id === form.businessDestinoId);
    const data = {
      businessSolicitanteId: business.id,
      businessSolicitanteNombre: business.nombre,
      jefeSolicitanteIC: profile?.nombreIC || "",
      jefeSolicitanteDiscord: profile?.nombreDiscord || "",
      businessDestinoId: form.businessDestinoId,
      businessDestinoNombre: destBiz?.nombre || "",
      jefeDestinoNombre: form.jefeDestinoNombre,
      fecha: form.fecha || new Date().toISOString().split("T")[0],
      aportaSolicitante: form.aportaSolicitante,
      aportaDestino: form.aportaDestino,
      firmaSolicitante: form.firmaSolicitante,
      firmaDestino: false,
      estado: "pendiente",
      userId: user?.id,
    };
    if (editingId) {
      await db.entities.Agreement.update(editingId, { ...data, estado: "pendiente" });
    } else {
      await db.entities.Agreement.create(data);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleAccept = async (conv) => {
    await db.entities.Agreement.update(conv.id, { firmaDestino: true, estado: "aceptado" });
    loadData();
  };

  const handleReject = async (conv) => {
    await db.entities.Agreement.update(conv.id, { estado: "devuelto", motivoRechazo: rejectMotivo });
    setRejectId(null); setRejectMotivo("");
    loadData();
  };

  const handleEdit = (conv) => {
    setForm({
      jefeDestinoNombre: conv.jefeDestinoNombre,
      businessDestinoId: conv.businessDestinoId,
      fecha: conv.fecha,
      aportaSolicitante: conv.aportaSolicitante,
      aportaDestino: conv.aportaDestino,
      firmaSolicitante: conv.firmaSolicitante,
    });
    setEditingId(conv.id);
    setShowForm(true);
  };

  const isSolicitante = (conv) => conv.businessSolicitanteId === business.id;
  const isDestino = (conv) => conv.businessDestinoId === business.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Handshake size={18} className="text-[#FDDC03]" /> Convenios
        </h2>
        {canAct && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#FDDC03] text-black text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-[#FDDC03]/90 transition-colors"
          >
            <Plus size={14} /> Nuevo Convenio
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSend} className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold">{editingId ? "Editar Convenio" : "Nuevo Convenio"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tu nombre IC</label>
              <input value={profile?.nombreIC || ""} readOnly className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tu Discord</label>
              <input value={profile?.nombreDiscord || ""} readOnly className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tu negocio</label>
              <input value={business.nombre} readOnly className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Negocio destino *</label>
              <select value={form.businessDestinoId} onChange={e => setForm(f => ({ ...f, businessDestinoId: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]">
                <option value="">Seleccionar...</option>
                {businesses.filter(b => b.id !== business.id).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre jefe que firma (destino) *</label>
              <input value={form.jefeDestinoNombre} onChange={e => setForm(f => ({ ...f, jefeDestinoNombre: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="Nombre IC del jefe" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Qué aporta {business.nombre} al otro negocio *</label>
            <textarea value={form.aportaSolicitante} onChange={e => setForm(f => ({ ...f, aportaSolicitante: e.target.value }))} required rows={3} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03] resize-none" placeholder="Describe las aportaciones..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Qué aporta el otro negocio a {business.nombre} *</label>
            <textarea value={form.aportaDestino} onChange={e => setForm(f => ({ ...f, aportaDestino: e.target.value }))} required rows={3} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03] resize-none" placeholder="Describe las aportaciones..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.firmaSolicitante} onChange={e => setForm(f => ({ ...f, firmaSolicitante: e.target.checked }))} className="accent-[#FDDC03]" />
            <span className="text-gray-300 text-sm">Firmar como {profile?.nombreIC}</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.firmaSolicitante} className="flex items-center gap-2 bg-[#FDDC03] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50">
              <Send size={14} /> {editingId ? "Reenviar" : "Enviar Solicitud"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-400 hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {convenios.map(conv => {
          const st = STATUS_LABELS[conv.estado] || STATUS_LABELS.pendiente;
          const sol = isSolicitante(conv);
          const dest = isDestino(conv);
          return (
            <div key={conv.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{conv.businessSolicitanteNombre} → {conv.businessDestinoNombre}</p>
                  <p className="text-gray-500 text-xs">{conv.fecha}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
                <div className="bg-[#0D0D0D] rounded-lg p-3">
                  <p className="text-[#FDDC03] text-xs font-bold mb-1">Aporta {conv.businessSolicitanteNombre}</p>
                  <p className="text-gray-300 text-xs">{conv.aportaSolicitante}</p>
                </div>
                <div className="bg-[#0D0D0D] rounded-lg p-3">
                  <p className="text-[#FDDC03] text-xs font-bold mb-1">Aporta {conv.businessDestinoNombre}</p>
                  <p className="text-gray-300 text-xs">{conv.aportaDestino}</p>
                </div>
              </div>
              {conv.motivoRechazo && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-3">
                  <p className="text-orange-400 text-xs"><span className="font-bold">Motivo devolución: </span>{conv.motivoRechazo}</p>
                </div>
              )}
              {/* Acciones */}
              {canAct && conv.estado === "pendiente" && dest && (
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(conv)} className="flex items-center gap-1.5 text-sm bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 font-bold">
                    <CheckCircle size={14} /> Aceptar
                  </button>
                  <button onClick={() => setRejectId(conv.id)} className="flex items-center gap-1.5 text-sm bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 font-bold">
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
              )}
              {canAct && conv.estado === "devuelto" && sol && (
                <button onClick={() => handleEdit(conv)} className="flex items-center gap-1.5 text-sm bg-[#FDDC03]/20 text-[#FDDC03] px-4 py-2 rounded-lg hover:bg-[#FDDC03]/30 font-bold">
                  <RotateCcw size={14} /> Editar y Reenviar
                </button>
              )}
              {rejectId === conv.id && (
                <div className="mt-3 space-y-2">
                  <textarea value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} placeholder="Motivo del rechazo..." rows={2} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]" />
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(conv)} className="text-sm bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-500/30">Confirmar Rechazo</button>
                    <button onClick={() => setRejectId(null)} className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {convenios.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No hay convenios todavía.</p>}
      </div>
    </div>
  );
}