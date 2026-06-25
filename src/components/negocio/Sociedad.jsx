

import { useState, useEffect } from "react";

import { formatDate, formatCurrency } from "@/lib/constants";
import { DollarSign, Upload, CheckCircle, XCircle, Clock, Send } from "lucide-react";

const STATUS = {
  pendiente: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  aprobado: { label: "Aprobado", color: "text-green-400", bg: "bg-green-400/10" },
  rechazado: { label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function Sociedad({ business, profile, user }) {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dineroAnterior: "", dineroEsta: "", fotoCaja: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadReports(); }, [business.id]);

  const loadReports = async () => {
    const r = await db.entities.SocietyReport.filter({ businessId: business.id }, "-fecha");
    setReports(r);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await db.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, fotoCaja: res.file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dineroAnterior || !form.dineroEsta) return;
    setSaving(true);
    await db.entities.SocietyReport.create({
      userId: user?.id,
      businessId: business.id,
      businessNombre: business.nombre,
      jefeIC: profile?.nombreIC || "",
      fecha: new Date().toISOString(),
      dineroSemanaAnterior: parseFloat(form.dineroAnterior),
      dineroEstaSemana: parseFloat(form.dineroEsta),
      fotoCaja: form.fotoCaja || "",
      estado: "pendiente",
    });
    setForm({ dineroAnterior: "", dineroEsta: "", fotoCaja: "" });
    setShowForm(false);
    setSaving(false);
    loadReports();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign size={18} className="text-[#FDDC03]" /> Sociedad
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#FDDC03] text-black text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-[#FDDC03]/90 transition-colors"
        >
          <Send size={14} /> Nuevo Informe
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold">Informe Semanal de Caja</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Jefe IC</label>
              <input value={profile?.nombreIC || ""} readOnly className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Negocio</label>
              <input value={business.nombre} readOnly className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dinero semana anterior ($) *</label>
              <input type="number" value={form.dineroAnterior} onChange={e => setForm(f => ({ ...f, dineroAnterior: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dinero esta semana ($) *</label>
              <input type="number" value={form.dineroEsta} onChange={e => setForm(f => ({ ...f, dineroEsta: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Foto de la caja</label>
            <label className="flex items-center gap-3 cursor-pointer w-full bg-[#0D0D0D] border border-dashed border-white/20 rounded-lg px-4 py-3 hover:border-[#FDDC03]/50 transition-colors">
              <Upload size={16} className="text-gray-400" />
              <span className="text-gray-400 text-sm">
                {uploading ? "Subiendo..." : form.fotoCaja ? "Imagen subida ✓" : "Subir imagen"}
              </span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {form.fotoCaja && (
              <img src={form.fotoCaja} alt="Caja" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#FDDC03] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50">
              {saving ? "Enviando..." : "Enviar Informe"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {reports.map(r => {
          const st = STATUS[r.estado] || STATUS.pendiente;
          const diff = r.dineroEstaSemana - r.dineroSemanaAnterior;
          return (
            <div key={r.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{r.jefeIC}</p>
                  <p className="text-gray-500 text-xs">{formatDate(r.fecha)}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#0D0D0D] rounded-lg p-2">
                  <p className="text-gray-500 text-xs">Semana anterior</p>
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
              {r.fotoCaja && <img src={r.fotoCaja} alt="Caja" className="mt-3 h-24 rounded-lg object-cover" />}
              {r.comentarioAdmin && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-gray-400 text-xs"><span className="font-bold text-white">Admin: </span>{r.comentarioAdmin}</p>
                </div>
              )}
            </div>
          );
        })}
        {reports.length === 0 && <p className="text-gray-500 text-sm text-center py-6">Sin informes de sociedad todavía.</p>}
      </div>
    </div>
  );
}