

import { useState, useEffect } from "react";

import { Wrench, Building2, Users } from "lucide-react";

export default function Civil() {
  const [businesses, setBusinesses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [biz, sh] = await Promise.all([
      db.entities.Business.filter({ activo: true }),
      db.entities.ServiceShift.filter({ activo: true }),
    ]);
    setBusinesses(biz);
    setShifts(sh);
    setLoading(false);
  };

  const getOpenEmployees = (businessId) =>
    shifts.filter(s => s.businessId === businessId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Users size={22} className="text-[#FDDC03]" /> Estado de Negocios
        </h1>
        <p className="text-gray-400 text-sm mt-1">Consulta qué negocios están abiertos en este momento.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#FDDC03]/30 border-t-[#FDDC03] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map(b => {
            const employees = getOpenEmployees(b.id);
            const isOpen = employees.length > 0;
            return (
              <div
                key={b.id}
                className="bg-[#1A1A1A] border rounded-2xl p-5 transition-all"
                style={{ borderColor: isOpen ? b.colorHEX : "rgba(255,255,255,0.1)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {b.categoria === "Mecánico" ? (
                      <Wrench size={18} style={{ color: b.colorHEX }} />
                    ) : (
                      <Building2 size={18} style={{ color: b.colorHEX }} />
                    )}
                    <div>
                      <h3 className="text-white font-bold text-sm">{b.nombre}</h3>
                      <span className="text-gray-500 text-xs">{b.categoria}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isOpen
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {isOpen ? "● Abierto" : "○ Cerrado"}
                  </span>
                </div>

                {isOpen && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-xs mb-1">{employees.length} empleado{employees.length !== 1 ? "s" : ""} en servicio</p>
                  </div>
                )}
              </div>
            );
          })}
          {businesses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              No hay negocios registrados todavía.
            </div>
          )}
        </div>
      )}
    </div>
  );
}