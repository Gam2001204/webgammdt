

import { useState, useEffect } from "react";

import { formatCurrency } from "@/lib/constants";
import { Wrench, Search, Pencil, Save, X } from "lucide-react";

export default function AdminVehiculos() {
  const [vehicles, setVehicles] = useState([]);
  const [basePrices, setBasePrices] = useState(null);
  const [search, setSearch] = useState("");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editingPrices, setEditingPrices] = useState(false);
  const [pricesForm, setPricesForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PER_PAGE = 50;

  useEffect(() => {
    Promise.all([
      db.entities.Vehicle.list("nombre", 600),
      db.entities.MechanicPrices.list(),
    ]).then(([v, p]) => {
      setVehicles(v);
      if (p.length > 0) { setBasePrices(p[0]); setPricesForm(p[0]); }
    });
  }, []);

  const filtered = vehicles.filter(v =>
    v.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (v.categoria || "").toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleSaveVehicle = async () => {
    if (!editingVehicle) return;
    setSaving(true);
    await db.entities.Vehicle.update(editingVehicle.id, { precio: parseFloat(editPrice) });
    setVehicles(v => v.map(x => x.id === editingVehicle.id ? { ...x, precio: parseFloat(editPrice) } : x));
    setEditingVehicle(null); setEditPrice("");
    setSaving(false);
  };

  const handleSavePrices = async () => {
    if (!basePrices) return;
    setSaving(true);
    await db.entities.MechanicPrices.update(basePrices.id, pricesForm);
    setBasePrices(pricesForm);
    setEditingPrices(false);
    setSaving(false);
  };

  const PRICE_LABELS = {
    completo: "Mecánica Completa", reparacion: "Reparación",
    gruaA: "Grúa Zona A", gruaB: "Grúa Zona B", gruaC: "Grúa Zona C",
    pinturaUnidad: "Pintura por unidad", piezasUnidad: "Piezas por unidad",
    motor: "Motor", frenos: "Frenos", suspension: "Suspensión",
    transmision: "Transmisión", turbo: "Turbo", blindaje: "Blindaje",
    precioBaseAsbo: "Precio base Asbo",
  };

  return (
    <div className="space-y-6">
      {/* Base prices */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2"><Wrench size={16} className="text-[#FDDC03]" /> Precios Base Mecánica (Asbo ref.)</h3>
          {!editingPrices ? (
            <button onClick={() => setEditingPrices(true)} className="flex items-center gap-1.5 text-sm text-[#FDDC03] border border-[#FDDC03]/30 px-3 py-1.5 rounded-lg hover:bg-[#FDDC03]/10">
              <Pencil size={13} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSavePrices} disabled={saving} className="flex items-center gap-1.5 text-sm bg-[#FDDC03] text-black font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"><Save size={13} /> Guardar</button>
              <button onClick={() => { setEditingPrices(false); setPricesForm(basePrices); }} className="text-sm text-gray-400 px-3 py-1.5 rounded-lg hover:bg-white/10"><X size={13} /></button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(PRICE_LABELS).map(([key, label]) => (
            <div key={key} className="bg-[#0D0D0D] rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              {editingPrices ? (
                <input
                  type="number"
                  value={pricesForm[key] || 0}
                  onChange={e => setPricesForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded px-2 py-1 text-[#FDDC03] text-sm font-bold focus:outline-none focus:border-[#FDDC03]"
                />
              ) : (
                <p className="text-[#FDDC03] font-bold text-sm">{formatCurrency(basePrices?.[key] || 0)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar vehículo..." className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03]" />
          </div>
          <span className="text-gray-500 text-sm whitespace-nowrap">{filtered.length} vehículos</span>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {paginated.map(v => (
            <div key={v.id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="text-white text-sm flex-1 font-medium">{v.nombre}</span>
              {v.categoria && <span className="text-gray-500 text-xs">{v.categoria}</span>}
              {editingVehicle?.id === v.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="w-24 bg-[#0D0D0D] border border-[#FDDC03] rounded px-2 py-1 text-[#FDDC03] text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveVehicle} disabled={saving} className="text-green-400 hover:text-green-300"><Save size={14} /></button>
                  <button onClick={() => { setEditingVehicle(null); setEditPrice(""); }} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[#FDDC03] font-bold text-sm">{formatCurrency(v.precio)}</span>
                  <button onClick={() => { setEditingVehicle(v); setEditPrice(String(v.precio)); }} className="text-gray-500 hover:text-[#FDDC03] p-1"><Pencil size={12} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-sm text-gray-400 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40">← Anterior</button>
            <span className="text-gray-400 text-sm">{page + 1} / {Math.ceil(filtered.length / PER_PAGE)}</span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PER_PAGE) - 1, p + 1))} disabled={(page + 1) * PER_PAGE >= filtered.length} className="text-sm text-gray-400 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}