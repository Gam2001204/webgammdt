

import { useState, useEffect } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { getBusinessRoles } from "@/lib/roles";
import { formatDate } from "@/lib/constants";
import { FileText, ChevronDown, CheckCircle, XCircle, Clock } from "lucide-react";

export default function SolicitarRol() {
  const { profile, businesses, user } = useUserProfile();
  const [myRequests, setMyRequests] = useState([]);
  const [form, setForm] = useState({ businessId: "", rolesSeleccionados: [] });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  useEffect(() => {
    if (user?.id) loadMyRequests();
  }, [user]);

  const loadMyRequests = async () => {
    const reqs = await db.entities.RoleRequest.filter({ userId: user.id }, "-fecha");
    setMyRequests(reqs);
  };

  const selectedBusiness = businesses?.find(b => b.id === form.businessId);

  const allRoles = businesses?.flatMap(b => getBusinessRoles(b.nombre).map(r => ({
    label: r,
    businessNombre: b.nombre,
    businessColor: b.colorHEX,
  }))) || [];

  const toggleRole = (roleLabel) => {
    setForm(f => ({
      ...f,
      rolesSeleccionados: f.rolesSeleccionados.includes(roleLabel)
        ? f.rolesSeleccionados.filter(r => r !== roleLabel)
        : [...f.rolesSeleccionados, roleLabel],
    }));
  };

  const getNextNumber = async () => {
    const all = await db.entities.RoleRequest.list("-fecha", 1);
    if (all.length === 0) return "#0000";
    const nums = all.map(r => parseInt(r.numero?.replace("#", "") || "0"));
    const max = Math.max(...nums);
    return `#${String(max + 1).padStart(4, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessId || form.rolesSeleccionados.length === 0) return;
    setSaving(true);
    const numero = await getNextNumber();
    await db.entities.RoleRequest.create({
      userId: user.id,
      userNombreIC: profile?.nombreIC || "",
      nombreDiscord: profile?.nombreDiscord || "",
      businessId: form.businessId,
      businessNombre: selectedBusiness?.nombre || "",
      rolesSeleccionados: form.rolesSeleccionados,
      estado: "pendiente",
      numero,
      fecha: new Date().toISOString(),
    });
    setForm({ businessId: "", rolesSeleccionados: [] });
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
    loadMyRequests();
  };

  const statusIcon = (estado) => {
    if (estado === "aceptada") return <CheckCircle size={14} className="text-green-400" />;
    if (estado === "denegada") return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-yellow-400" />;
  };

  const statusLabel = (estado) => {
    if (estado === "aceptada") return "Aceptada";
    if (estado === "denegada") return "Denegada";
    return "Pendiente";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText size={22} className="text-[#FDDC03]" /> Solicitar Rol
        </h1>
        <p className="text-gray-400 text-sm mt-1">Solicita un rol de negocio al equipo de administración.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tu nombre de Discord</label>
          <input
            type="text"
            value={profile?.nombreDiscord || ""}
            readOnly
            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Negocio</label>
          <select
            value={form.businessId}
            onChange={e => setForm(f => ({ ...f, businessId: e.target.value, rolesSeleccionados: [] }))}
            className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FDDC03]"
          >
            <option value="">Selecciona un negocio...</option>
            {businesses?.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Roles a solicitar ({form.rolesSeleccionados.length} seleccionados)
          </label>
          <button
            type="button"
            onClick={() => setRolesOpen(!rolesOpen)}
            className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-left text-sm text-white flex items-center justify-between focus:outline-none focus:border-[#FDDC03]"
          >
            <span className="text-gray-400">
              {form.rolesSeleccionados.length > 0 ? form.rolesSeleccionados.join(", ") : "Selecciona roles..."}
            </span>
            <ChevronDown size={16} className={`transition-transform ${rolesOpen ? "rotate-180" : ""}`} />
          </button>
          {rolesOpen && (
            <div className="absolute z-10 w-full mt-1 bg-[#1A1A1A] border border-white/20 rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto">
              {businesses?.map(b => (
                <div key={b.id}>
                  <div className="px-3 py-1.5 text-xs text-gray-500 bg-[#0D0D0D] border-b border-white/10 font-bold" style={{ color: b.colorHEX }}>
                    {b.nombre}
                  </div>
                  {getBusinessRoles(b.nombre).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          form.rolesSeleccionados.includes(role)
                            ? "border-[#FDDC03] bg-[#FDDC03]"
                            : "border-gray-600"
                        }`}
                      >
                        {form.rolesSeleccionados.includes(role) && <span className="text-black text-xs font-bold">✓</span>}
                      </span>
                      <span style={{ color: b.colorHEX }}>{role}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
            <CheckCircle size={16} /> Solicitud enviada correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !form.businessId || form.rolesSeleccionados.length === 0}
          className="w-full bg-[#FDDC03] text-black font-bold py-3 rounded-lg hover:bg-[#FDDC03]/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </form>

      {/* My requests */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Mis Solicitudes</h2>
        <div className="space-y-3">
          {myRequests.map(req => (
            <div key={req.id} className="bg-[#0D0D0D] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#FDDC03] font-mono text-sm font-bold">{req.numero}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  {statusIcon(req.estado)} {statusLabel(req.estado)}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-1"><span className="text-white">{req.businessNombre}</span></p>
              <p className="text-gray-500 text-xs">{req.rolesSeleccionados?.join(", ")}</p>
              {req.motivoDenegacion && (
                <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="text-red-400 text-xs"><span className="font-bold">Motivo: </span>{req.motivoDenegacion}</p>
                </div>
              )}
              <p className="text-gray-600 text-xs mt-2">{formatDate(req.fecha)}</p>
            </div>
          ))}
          {myRequests.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No tienes solicitudes todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}