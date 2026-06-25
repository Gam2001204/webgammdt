

import { useState, useEffect } from "react";

import { BADULAQUE_ITEMS, OCIO_ITEMS, MECHANIC_BASE_PRICES, calcMechanicPrice, formatCurrency } from "@/lib/constants";
import { Calculator, ChevronDown, Plus, Minus, RotateCcw, History, Check } from "lucide-react";
import { formatDate } from "@/lib/constants";

function BadulaqueCalc({ items, profile, user, business, onSaved }) {
  const [quantities, setQuantities] = useState({});
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const allItems = [
    ...items,
    ...(business.itemsPersonalizados || []),
  ];

  const subtotal = allItems.reduce((sum, item) => sum + (quantities[item.nombre] || 0) * item.precio, 0);
  const discountAmount = Math.round(subtotal * (discount / 100) * 100) / 100;
  const total = subtotal - discountAmount;

  const setQty = (nombre, val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setQuantities(q => ({ ...q, [nombre]: n }));
  };

  const handleSave = async () => {
    if (total === 0) return;
    setSaving(true);
    const soldItems = allItems
      .filter(i => quantities[i.nombre] > 0)
      .map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: quantities[i.nombre] }));
    await db.entities.CalculatorHistory.create({
      userId: user?.id,
      userNombreIC: profile?.nombreIC || "",
      businessId: business.id,
      businessNombre: business.nombre,
      tipo: business.categoria === "Local de Ocio" ? "Local de Ocio" : "Badulaque",
      items: soldItems,
      total,
      fecha: new Date().toISOString(),
    });
    setQuantities({});
    setDiscount(0);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allItems.map(item => (
          <div key={item.nombre} className="flex items-center justify-between bg-[#0D0D0D] rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-medium">{item.nombre}</p>
              <p className="text-[#FDDC03] text-xs font-bold">{formatCurrency(item.precio)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty(item.nombre, (quantities[item.nombre] || 0) - 1)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <Minus size={12} />
              </button>
              <input
                type="number"
                min="0"
                value={quantities[item.nombre] || 0}
                onChange={e => setQty(item.nombre, e.target.value)}
                className="w-12 text-center bg-[#1A1A1A] border border-white/20 rounded-lg text-white font-bold text-sm py-1 focus:outline-none focus:border-[#FDDC03]"
              />
              <button
                onClick={() => setQty(item.nombre, (quantities[item.nombre] || 0) + 1)}
                className="w-7 h-7 rounded-lg bg-[#FDDC03]/20 hover:bg-[#FDDC03]/30 flex items-center justify-center text-[#FDDC03]"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Descuento */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-300 text-sm font-medium flex-1">Descuento</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDiscount(d => Math.max(0, d - 5))} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><Minus size={12} /></button>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={e => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-14 text-center bg-[#1A1A1A] border border-white/20 rounded-lg text-white font-bold text-sm py-1 focus:outline-none focus:border-[#FDDC03]"
          />
          <span className="text-gray-400 text-sm">%</span>
          <button onClick={() => setDiscount(d => Math.min(100, d + 5))} className="w-7 h-7 rounded-lg bg-[#FDDC03]/20 hover:bg-[#FDDC03]/30 flex items-center justify-center text-[#FDDC03]"><Plus size={12} /></button>
        </div>
        {discount > 0 && <span className="text-red-400 text-sm font-bold">-{formatCurrency(discountAmount)}</span>}
      </div>

      <div className="bg-[#FDDC03]/10 border border-[#FDDC03]/30 rounded-xl p-4">
        {discount > 0 && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-gray-300">{formatCurrency(subtotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white font-bold">Total</span>
          <span className="text-[#FDDC03] text-2xl font-black">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || total === 0}
          className="flex-1 bg-[#FDDC03] text-black font-bold py-3 rounded-xl hover:bg-[#FDDC03]/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando..." : "Registrar Venta"}
        </button>
        <button
          onClick={() => { setQuantities({}); setDiscount(0); }}
          className="px-4 py-3 bg-white/10 text-gray-400 rounded-xl hover:bg-white/20 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

function MechanicCalc({ profile, user, business, onSaved }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [services, setServices] = useState({
    completo: false, reparacion: false,
    gruaA: false, gruaB: false, gruaC: false,
    motor: false, frenos: false, suspension: false,
    transmision: false, turbo: false, blindaje: false,
  });
  const [pintura, setPintura] = useState(0);
  const [piezas, setPiezas] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [basePrices, setBasePrices] = useState(MECHANIC_BASE_PRICES);
  const [saving, setSaving] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleOpen, setVehicleOpen] = useState(false);

  useEffect(() => {
    db.entities.Vehicle.list("nombre", 600).then(setVehicles);
    db.entities.MechanicPrices.list().then(list => { if (list.length > 0) setBasePrices(list[0]); });
  }, []);

  const filteredVehicles = vehicles.filter(v =>
    v.nombre.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const calcPrice = (key, qty = 1) => {
    if (!selectedVehicle) return 0;
    return Math.round(calcMechanicPrice(basePrices[key] || 0, selectedVehicle.precio, basePrices.precioBaseAsbo) * qty * 100) / 100;
  };

  const serviceLabels = {
    completo: "Mecánica Completa", reparacion: "Reparación",
    gruaA: "Grúa Zona A", gruaB: "Grúa Zona B", gruaC: "Grúa Zona C",
    motor: "Motor", frenos: "Frenos", suspension: "Suspensión",
    transmision: "Transmisión", turbo: "Turbo", blindaje: "Blindaje",
  };

  const itemizedList = [];
  if (services.reparacion) itemizedList.push({ nombre: "Reparación", precio: calcPrice("reparacion"), cantidad: 1 });
  if (services.completo) itemizedList.push({ nombre: "Mecánica Completa", precio: calcPrice("completo"), cantidad: 1 });
  if (services.gruaA) itemizedList.push({ nombre: "Grúa Zona A", precio: calcPrice("gruaA"), cantidad: 1 });
  if (services.gruaB) itemizedList.push({ nombre: "Grúa Zona B", precio: calcPrice("gruaB"), cantidad: 1 });
  if (services.gruaC) itemizedList.push({ nombre: "Grúa Zona C", precio: calcPrice("gruaC"), cantidad: 1 });
  if (pintura > 0) itemizedList.push({ nombre: `Pintura x${pintura}`, precio: calcPrice("pinturaUnidad", pintura), cantidad: pintura });
  if (piezas > 0) itemizedList.push({ nombre: `Piezas x${piezas}`, precio: calcPrice("piezasUnidad", piezas), cantidad: piezas });
  if (services.motor) itemizedList.push({ nombre: "Motor", precio: calcPrice("motor"), cantidad: 1 });
  if (services.frenos) itemizedList.push({ nombre: "Frenos", precio: calcPrice("frenos"), cantidad: 1 });
  if (services.suspension) itemizedList.push({ nombre: "Suspensión", precio: calcPrice("suspension"), cantidad: 1 });
  if (services.transmision) itemizedList.push({ nombre: "Transmisión", precio: calcPrice("transmision"), cantidad: 1 });
  if (services.turbo) itemizedList.push({ nombre: "Turbo", precio: calcPrice("turbo"), cantidad: 1 });
  if (services.blindaje) itemizedList.push({ nombre: "Blindaje", precio: calcPrice("blindaje"), cantidad: 1 });

  const subtotal = itemizedList.reduce((s, i) => s + i.precio, 0);
  const discountAmount = Math.round(subtotal * (discount / 100) * 100) / 100;
  const total = subtotal - discountAmount;

  const toggleService = (key) => setServices(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    if (!selectedVehicle || total === 0) return;
    setSaving(true);
    await db.entities.CalculatorHistory.create({
      userId: user?.id,
      userNombreIC: profile?.nombreIC || "",
      businessId: business.id,
      businessNombre: business.nombre,
      tipo: "Mecánico",
      vehiculo: selectedVehicle.nombre,
      vehiculoPrecio: selectedVehicle.precio,
      items: itemizedList,
      total,
      fecha: new Date().toISOString(),
    });
    setServices({ completo: false, reparacion: false, gruaA: false, gruaB: false, gruaC: false, motor: false, frenos: false, suspension: false, transmision: false, turbo: false, blindaje: false });
    setPintura(0); setPiezas(0); setDiscount(0); setSelectedVehicle(null); setVehicleSearch("");
    setSaving(false);
    onSaved();
  };

  const ServiceBtn = ({ skey, label }) => (
    <button
      onClick={() => toggleService(skey)}
      disabled={!selectedVehicle}
      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 ${
        services[skey]
          ? "bg-[#FDDC03]/20 border-[#FDDC03] text-[#FDDC03]"
          : "bg-[#0D0D0D] border-white/10 text-gray-300 hover:border-white/30"
      }`}
    >
      <span>{label}</span>
      {selectedVehicle && <span className="text-xs font-bold ml-2">{formatCurrency(calcPrice(skey))}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Vehicle selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">Vehículo</label>
        <button
          type="button"
          onClick={() => setVehicleOpen(!vehicleOpen)}
          className="w-full bg-[#0D0D0D] border border-white/20 rounded-xl px-4 py-3 text-left text-sm flex items-center justify-between focus:outline-none focus:border-[#FDDC03]"
        >
          <span className={selectedVehicle ? "text-white font-medium" : "text-gray-500"}>
            {selectedVehicle ? `${selectedVehicle.nombre} — ${formatCurrency(selectedVehicle.precio)}` : "Selecciona un vehículo..."}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${vehicleOpen ? "rotate-180" : ""}`} />
        </button>
        {vehicleOpen && (
          <div className="absolute z-20 w-full mt-1 bg-[#1A1A1A] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                value={vehicleSearch}
                onChange={e => setVehicleSearch(e.target.value)}
                placeholder="Buscar vehículo..."
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03]"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredVehicles.slice(0, 100).map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setSelectedVehicle(v); setVehicleOpen(false); setVehicleSearch(""); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-white">{v.nombre}</span>
                  <span className="text-[#FDDC03] font-bold text-xs">{formatCurrency(v.precio)}</span>
                </button>
              ))}
              {filteredVehicles.length === 0 && (
                <div className="px-4 py-4 text-gray-500 text-sm text-center">Sin resultados</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reparación siempre visible */}
      <ServiceBtn skey="reparacion" label="Reparación" />

      {/* Servicios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ServiceBtn skey="completo" label="Mecánica Completa" />
        <ServiceBtn skey="gruaA" label="Grúa Zona A" />
        <ServiceBtn skey="gruaB" label="Grúa Zona B" />
        <ServiceBtn skey="gruaC" label="Grúa Zona C" />
        <ServiceBtn skey="motor" label="Motor" />
        <ServiceBtn skey="frenos" label="Frenos" />
        <ServiceBtn skey="suspension" label="Suspensión" />
        <ServiceBtn skey="transmision" label="Transmisión" />
        <ServiceBtn skey="turbo" label="Turbo" />
        <ServiceBtn skey="blindaje" label="Blindaje" />
      </div>

      {/* Pintura */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Pintura {selectedVehicle && pintura > 0 && <span className="text-[#FDDC03]">— {formatCurrency(calcPrice("pinturaUnidad", pintura))}</span>}
        </label>
        <select
          value={pintura}
          onChange={e => setPintura(Number(e.target.value))}
          disabled={!selectedVehicle}
          className="w-full bg-[#0D0D0D] border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FDDC03] disabled:opacity-40"
        >
          {[0,1,2,3].map(n => <option key={n} value={n}>{n === 0 ? "Sin pintura" : `${n} capa${n > 1 ? "s" : ""} — ${formatCurrency(100 * n)}`}</option>)}
        </select>
      </div>

      {/* Piezas */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Piezas {selectedVehicle && piezas > 0 && <span className="text-[#FDDC03]">— {formatCurrency(calcPrice("piezasUnidad", piezas))}</span>}
        </label>
        <select
          value={piezas}
          onChange={e => setPiezas(Number(e.target.value))}
          disabled={!selectedVehicle}
          className="w-full bg-[#0D0D0D] border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FDDC03] disabled:opacity-40"
        >
          {Array.from({length: 41}, (_, i) => i).map(n => (
            <option key={n} value={n}>{n === 0 ? "Sin piezas" : `${n} pieza${n > 1 ? "s" : ""} — ${formatCurrency(100 * n)}`}</option>
          ))}
        </select>
      </div>

      {/* Resumen */}
      {itemizedList.length > 0 && (
        <div className="bg-[#0D0D0D] rounded-xl p-4 space-y-2">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Resumen</p>
          {itemizedList.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.nombre}</span>
              <span className="text-white font-medium">{formatCurrency(item.precio)}</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-400">
              <span>Descuento ({discount}%)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-[#FDDC03] text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Descuento */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-300 text-sm font-medium flex-1">Descuento</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDiscount(d => Math.max(0, d - 5))} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><Minus size={12} /></button>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={e => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-14 text-center bg-[#1A1A1A] border border-white/20 rounded-lg text-white font-bold text-sm py-1 focus:outline-none focus:border-[#FDDC03]"
          />
          <span className="text-gray-400 text-sm">%</span>
          <button onClick={() => setDiscount(d => Math.min(100, d + 5))} className="w-7 h-7 rounded-lg bg-[#FDDC03]/20 hover:bg-[#FDDC03]/30 flex items-center justify-center text-[#FDDC03]"><Plus size={12} /></button>
        </div>
        {discount > 0 && <span className="text-red-400 text-sm font-bold">-{formatCurrency(discountAmount)}</span>}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !selectedVehicle || total === 0}
        className="w-full bg-[#FDDC03] text-black font-bold py-3 rounded-xl hover:bg-[#FDDC03]/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Guardando..." : "Registrar Servicio"}
      </button>
    </div>
  );
}

export default function CalculadoraNegocio({ business, profile, user }) {
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    const h = await db.entities.CalculatorHistory.filter({ businessId: business.id }, "-fecha", 20);
    setHistory(h);
  };

  useEffect(() => { loadHistory(); }, [business.id]);

  const calculadoraTipos = business.calculadoraTipos || [];
  const hasStandard = calculadoraTipos.includes("Estándar") || calculadoraTipos.length === 0;
  const hasCustom = calculadoraTipos.includes("Personalizada") || (business.itemsPersonalizados?.length > 0);
  const isMecanico = business.categoria === "Mecánico";
  const isBadulaque = business.categoria === "Badulaque";
  const isOcio = business.categoria === "Local de Ocio";

  const stdItems = isBadulaque ? BADULAQUE_ITEMS : isOcio ? OCIO_ITEMS : [];

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator size={18} className="text-[#FDDC03]" /> Calculadora
          </h2>
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/30 transition-colors"
          >
            <History size={14} /> Historial
          </button>
        </div>

        {isMecanico ? (
          <MechanicCalc profile={profile} user={user} business={business} onSaved={loadHistory} />
        ) : (
          <BadulaqueCalc
            items={hasStandard ? stdItems : []}
            profile={profile} user={user} business={business} onSaved={loadHistory}
          />
        )}
      </div>

      {showHistory && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History size={18} className="text-[#FDDC03]" /> Historial de Ventas
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className="bg-[#0D0D0D] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {h.vehiculo && <p className="text-white font-medium text-sm">{h.vehiculo} — {formatCurrency(h.vehiculoPrecio)}</p>}
                    <p className="text-gray-500 text-xs">{h.userNombreIC} · {formatDate(h.fecha)}</p>
                  </div>
                  <span className="text-[#FDDC03] font-black text-lg">{formatCurrency(h.total)}</span>
                </div>
                {h.items?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {h.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400">
                        <span>{item.nombre}{item.cantidad > 1 ? ` ×${item.cantidad}` : ""}</span>
                        <span>{formatCurrency(item.precio)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {history.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin historial todavía.</p>}
          </div>
        </div>
      )}
    </div>
  );
}