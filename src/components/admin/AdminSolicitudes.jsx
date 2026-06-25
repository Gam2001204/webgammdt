

import { useState, useEffect } from "react";

import { getBusinessRoles } from "@/lib/roles";
import { formatDate } from "@/lib/constants";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [denyId, setDenyId] = useState(null);
  const [denyMotivo, setDenyMotivo] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("pendiente");

  useEffect(() => {
    Promise.all([
      db.entities.RoleRequest.list("-fecha"),
      db.entities.Business.filter({ activo: true }),
      db.entities.UserProfile.list(),
    ]).then(([r, b, p]) => { setRequests(r); setBusinesses(b); setProfiles(p); });
  }, []);

  const reload = async () => {
    const [r, p] = await Promise.all([
      db.entities.RoleRequest.list("-fecha"),
      db.entities.UserProfile.list(),
    ]);
    setRequests(r); setProfiles(p);
  };

  const getProfile = (userId) => profiles.find(p => p.userId === userId);

  const handleAccept = async (req) => {
    setProcessing(true);
    const profile = getProfile(req.userId);
    if (profile?.id) {
      const currentRoles = profile.roles || [];
      const newRoles = [...new Set([...currentRoles, ...req.rolesSeleccionados])];
      await db.entities.UserProfile.update(profile.id, { roles: newRoles });
    }
    await db.entities.RoleRequest.update(req.id, { estado: "aceptada" });
    setProcessing(false);
    reload();
  };

  const handleDeny = async (req) => {
    setProcessing(true);
    await db.entities.RoleRequest.update(req.id, { estado: "denegada", motivoDenegacion: denyMotivo });
    setDenyId(null); setDenyMotivo("");
    setProcessing(false);
    reload();
  };

  const filtered = requests.filter(r => filter === "todas" ? true : r.estado === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pendiente", "aceptada", "denegada", "todas"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${filter === f ? "bg-[#FDDC03] text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
          >
            {f === "todas" ? "Todas" : f === "pendiente" ? "Pendientes" : f === "aceptada" ? "Aceptadas" : "Denegadas"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(req => {
          const p = getProfile(req.userId);
          return (
            <div key={req.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#FDDC03] font-mono font-bold text-sm">{req.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      req.estado === "pendiente" ? "bg-yellow-400/10 text-yellow-400" :
                      req.estado === "aceptada" ? "bg-green-400/10 text-green-400" :
                      "bg-red-400/10 text-red-400"
                    }`}>
                      {req.estado}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm">{p?.nombreIC || "Usuario"}</p>
                  <p className="text-gray-500 text-xs">@{req.nombreDiscord} · {req.businessNombre}</p>
                </div>
                <p className="text-gray-500 text-xs">{formatDate(req.fecha)}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {req.rolesSeleccionados?.map(role => {
                  const biz = businesses.find(b => getBusinessRoles(b.nombre).includes(role));
                  return (
                    <span key={role} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: biz?.colorHEX || "#fff3", color: biz?.colorHEX || "#9ca3af" }}>
                      {role}
                    </span>
                  );
                })}
              </div>

              {req.motivoDenegacion && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3">
                  <p className="text-red-400 text-xs"><span className="font-bold">Motivo: </span>{req.motivoDenegacion}</p>
                </div>
              )}

              {req.estado === "pendiente" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={processing}
                    className="flex items-center gap-1.5 text-sm bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 font-bold disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> Aceptar
                  </button>
                  <button
                    onClick={() => setDenyId(req.id)}
                    className="flex items-center gap-1.5 text-sm bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 font-bold"
                  >
                    <XCircle size={14} /> Denegar
                  </button>
                </div>
              )}

              {denyId === req.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={denyMotivo}
                    onChange={e => setDenyMotivo(e.target.value)}
                    placeholder="Motivo de la denegación..."
                    rows={2}
                    className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FDDC03]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleDeny(req)} disabled={processing} className="text-sm bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-500/30 disabled:opacity-50">
                      {processing ? "..." : "Confirmar Denegación"}
                    </button>
                    <button onClick={() => setDenyId(null)} className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-white/10">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No hay solicitudes.</p>}
      </div>
    </div>
  );
}