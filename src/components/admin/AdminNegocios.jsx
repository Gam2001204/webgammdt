

import { useState, useEffect } from "react";

import { getRandomColor } from "@/lib/constants";
import { Plus, Pencil, Trash2, Wrench, Building2, X, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIAS = ["Badulaque", "Local de Ocio", "Mecánico"];
const CALC_TIPOS = ["Estándar", "Personalizada"];

export default function AdminNegocios() {
  const [businesses, setBusinesses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", categoria: "Badulaque", colorHEX: getRandomColor(),
    calculadoraTipos: ["Estándar"], itemsPersonalizados: [], descripcion: "", activo: true,
  });
  const [newItem, setNewItem] = useState({ nombre: "", precio: "" });

  useEffect(() => { loadBusinesses(); }, []);

  const loadBusinesses = async () => {
    const b = await db.entities.Business.list("-created_date");
    setBusinesses(b);
  };

  const resetForm = () => {
    setForm({ nombre: "", categoria: "Badulaque", colorHEX: getRandomColor(), calculadoraTipos: ["Estándar"], itemsPersonalizados: [], descripcion: "", activo: true });
    setEditing(null); setShowForm(false);
  };

  const handleEdit = (b) => {
    setForm({
      nombre: b.nombre, categoria: b.categoria, colorHEX: b.colorHEX,
      calculadoraTipos: b.calculadoraTipos || ["Estándar"],
      itemsPersonalizados: b.itemsPersonalizados || [],
      descripcion: b.descripcion || "", activo: b.activo !== false,
    });
    setEditing(b.id); setShowForm(true);
  };

  const toggleCalcTipo = (tipo) => {
    setForm(f => ({
      ...f,
      calculadoraTipos: f.calculadoraTipos.includes(tipo)
        ? f.calculadoraTipos.filter(t => t !== tipo)
        : [...f.calculadoraTipos, tipo],
    }));
  };

  const addItem = () => {
    if (!newItem.nombre || !newItem.precio) return;
    setForm(f => ({ ...f, itemsPersonalizados: [...f.itemsPersonalizados, { nombre: newItem.nombre, precio: parseFloat(newItem.precio) }] }));
    setNewItem({ nombre: "", precio: "" });
  };

  const removeItem = (idx) => setForm(f => ({ ...f, itemsPersonalizados: f.itemsPersonalizados.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    if (editing) {
      await db.entities.Business.update(editing, form);
    } else {
      await db.entities.Business.create({ ...form, colorHEX: form.colorHEX || getRandomColor() });
    }
    setSaving(false);
    resetForm();
    loadBusinesses();
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`¿Eliminar "${b.nombre}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    // Delete all related data
    await Promise.all([
      db.entities.ServiceShift.deleteMany({ businessId: b.id }),
      db.entities.CalculatorHistory.deleteMany({ businessId: b.id }),
      db.entities.RoleRequest.deleteMany({ businessId: b.id }),
      db.entities.Announcement.deleteMany({ businessId: b.id }),
      db.entities.Agreement.deleteMany({ businessSolicitanteId: b.id }),
      db.entities.Agreement.deleteMany({ businessDestinoId: b.id }),
      db.entities.SocietyReport.deleteMany({ businessId: b.id }),
      db.entities.Sanction.deleteMany({ businessId: b.id }),
    ]);
    await db.entities.Business.delete(b.id);
    loadBusinesses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Negocios ({businesses.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#FDDC03] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#FDDC03]/90 transition-colors"
        >
          <Plus size={14} /> Nuevo Negocio
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold">{editing ? "Editar Negocio" : "Crear Negocio"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="Nombre del negocio" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoría *</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Color HEX</label>
              <div className="flex gap-2">
                <input type="color" value={form.colorHEX} onChange={e => setForm(f => ({ ...f, colorHEX: e.target.value }))} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
                <input value={form.colorHEX} onChange={e => setForm(f => ({ ...f, colorHEX: e.target.value }))} className="flex-1 bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#FDDC03]" placeholder="#RRGGBB" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" placeholder="Descripción del negocio" />
            </div>
          </div>

          {/* Calculadora tipos */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Tipos de Calculadora</label>
            <div className="flex gap-3">
              {CALC_TIPOS.map(tipo => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.calculadoraTipos.includes(tipo)} onChange={() => toggleCalcTipo(tipo)} className="accent-[#FDDC03]" />
                  <span className="text-gray-300 text-sm">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ítems personalizados */}
          {form.calculadoraTipos.includes("Personalizada") && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Ítems Personalizados</label>
              <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                {form.itemsPersonalizados.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#0D0D0D] rounded-lg px-3 py-2">
                    <span className="text-white text-sm flex-1">{item.nombre}</span>
                    <span className="text-[#FDDC03] text-sm font-bold">${item.precio}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newItem.nombre} onChange={e => setNewItem(n => ({ ...n, nombre: e.target.value }))} placeholder="Nombre ítem" className="flex-1 bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" />
                <input type="number" value={newItem.precio} onChange={e => setNewItem(n => ({ ...n, precio: e.target.value }))} placeholder="Precio" className="w-24 bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FDDC03]" />
                <button type="button" onClick={addItem} className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 text-sm"><Plus size={14} /></button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-[#FDDC03] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50">
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear Negocio"}
            </button>
            <button type="button" onClick={resetForm} className="text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {businesses.map(b => (
          <div key={b.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${b.colorHEX}20`, border: `2px solid ${b.colorHEX}` }}>
              {b.categoria === "Mecánico" ? <Wrench size={16} style={{ color: b.colorHEX }} /> : <Building2 size={16} style={{ color: b.colorHEX }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold">{b.nombre}</h3>
                <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">{b.categoria}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gray-400">{b.colorHEX}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.colorHEX }} />
                {b.calculadoraTipos?.map(t => <span key={t} className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>)}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(b)} className="p-2 text-gray-400 hover:text-[#FDDC03] hover:bg-[#FDDC03]/10 rounded-lg transition-colors"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(b)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {businesses.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No hay negocios creados todavía.</p>}
      </div>
    </div>
  );
}