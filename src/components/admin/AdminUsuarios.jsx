

import { useState, useEffect } from "react";

import { getBusinessRoles } from "@/lib/roles";
import { Users, ChevronDown, Search, Shield, User } from "lucide-react";

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.User.list(),
      db.entities.UserProfile.list(),
      db.entities.Business.filter({ activo: true }),
    ]).then(([u, p, b]) => { setUsers(u); setProfiles(p); setBusinesses(b); });
  }, []);

  const getProfile = (userId) => profiles.find(p => p.userId === userId);

  const filteredUsers = users.filter(u => {
    const p = getProfile(u.id);
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) ||
      p?.nombreIC?.toLowerCase().includes(q) ||
      p?.nombreDiscord?.toLowerCase().includes(q);
  });

  const allRoles = businesses.flatMap(b => getBusinessRoles(b.nombre).map(r => ({
    label: r, businessNombre: b.nombre, businessColor: b.colorHEX,
  })));

  const openEdit = (user) => {
    const p = getProfile(user.id);
    setEditingUser(user);
    setSelectedRoles(p?.roles || []);
    setEsAdmin(p?.esAdmin || false);
    setRolesOpen(false);
  };

  const toggleRole = (roleLabel) => {
    setSelectedRoles(r => r.includes(roleLabel) ? r.filter(x => x !== roleLabel) : [...r, roleLabel]);
  };

  const handleSave = async () => {
    setSaving(true);
    const p = getProfile(editingUser.id);
    if (p?.id) {
      await db.entities.UserProfile.update(p.id, { roles: selectedRoles, esAdmin });
    } else {
      await db.entities.UserProfile.create({ userId: editingUser.id, roles: selectedRoles, esAdmin, onboardingCompletado: false });
    }
    const [updProfiles] = await Promise.all([db.entities.UserProfile.list()]);
    setProfiles(updProfiles);
    setSaving(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email, nombre IC o Discord..."
            className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03]"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map(u => {
          const p = getProfile(u.id);
          return (
            <div key={u.id} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FDDC03]/10 flex items-center justify-center">
                    {p?.esAdmin ? <Shield size={14} className="text-[#FDDC03]" /> : <User size={14} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{p?.nombreIC || u.full_name || "Sin nombre IC"}</p>
                    <p className="text-gray-500 text-xs">{u.email} {p?.nombreDiscord && `· @${p.nombreDiscord}`}</p>
                    {p?.esAdmin && <span className="text-[#FDDC03] text-xs font-bold">ADMIN</span>}
                  </div>
                </div>
                <button
                  onClick={() => editingUser?.id === u.id ? setEditingUser(null) : openEdit(u)}
                  className="text-sm text-gray-400 border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#FDDC03] hover:text-[#FDDC03] transition-colors"
                >
                  {editingUser?.id === u.id ? "Cerrar" : "Gestionar Roles"}
                </button>
              </div>

              {/* Roles display */}
              {p?.roles?.length > 0 && editingUser?.id !== u.id && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.roles.map(role => {
                    const biz = businesses.find(b => getBusinessRoles(b.nombre).includes(role));
                    return (
                      <span key={role} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: biz?.colorHEX || "#fff3", color: biz?.colorHEX || "#9ca3af", backgroundColor: `${biz?.colorHEX || "#fff"}15` }}>
                        {role}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Edit panel */}
              {editingUser?.id === u.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={esAdmin} onChange={e => setEsAdmin(e.target.checked)} className="accent-[#FDDC03]" />
                    <span className="text-gray-300 text-sm font-medium">Administrador</span>
                  </label>

                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Roles ({selectedRoles.length} asignados)</label>
                    <button
                      type="button"
                      onClick={() => setRolesOpen(!rolesOpen)}
                      className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-left text-sm flex items-center justify-between"
                    >
                      <span className="text-gray-400 truncate">
                        {selectedRoles.length > 0 ? selectedRoles.join(", ") : "Sin roles asignados"}
                      </span>
                      <ChevronDown size={14} className={`flex-shrink-0 ml-2 text-gray-400 transition-transform ${rolesOpen ? "rotate-180" : ""}`} />
                    </button>
                    {rolesOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-[#1A1A1A] border border-white/20 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                        {businesses.map(b => (
                          <div key={b.id}>
                            <div className="px-3 py-1.5 text-xs bg-[#0D0D0D] border-b border-white/10 font-bold" style={{ color: b.colorHEX }}>
                              {b.nombre}
                            </div>
                            {getBusinessRoles(b.nombre).map(role => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 text-left"
                              >
                                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedRoles.includes(role) ? "border-[#FDDC03] bg-[#FDDC03]" : "border-gray-600"}`}>
                                  {selectedRoles.includes(role) && <span className="text-black text-xs font-bold">✓</span>}
                                </span>
                                <span style={{ color: b.colorHEX }}>{role}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#FDDC03] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50 text-sm"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}