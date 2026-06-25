

import { useState, useEffect } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { User, Save, Link2, CheckCircle, Shield } from "lucide-react";

export default function Perfil() {
  const { profile, user, reload } = useUserProfile();
  const [nombreIC, setNombreIC] = useState("");
  const [nombreDiscord, setNombreDiscord] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [savedDiscord, setSavedDiscord] = useState(false);

  useEffect(() => {
    if (profile) {
      setNombreIC(profile.nombreIC || "");
      setNombreDiscord(profile.nombreDiscord || "");
      setDiscordId(profile.discordId || "");
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (profile?.id) {
      await db.entities.UserProfile.update(profile.id, {
        nombreIC: nombreIC.trim(),
        nombreDiscord: nombreDiscord.trim(),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reload();
  };

  const handleSaveDiscord = async (e) => {
    e.preventDefault();
    setSavingDiscord(true);
    if (profile?.id) {
      await db.entities.UserProfile.update(profile.id, {
        discordId: discordId.trim(),
        discordVinculado: !!discordId.trim(),
        nombreDiscord: nombreDiscord.trim() || profile.nombreDiscord,
      });
    }
    setSavingDiscord(false);
    setSavedDiscord(true);
    setTimeout(() => setSavedDiscord(false), 2000);
    reload();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <User size={22} className="text-[#FDDC03]" /> Mi Perfil
        </h1>
      </div>

      {/* Info básica */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FDDC03]/20 flex items-center justify-center">
            <User size={28} className="text-[#FDDC03]" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{profile?.nombreIC || "Sin nombre IC"}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            {profile?.esAdmin && (
              <span className="inline-flex items-center gap-1 text-xs text-[#FDDC03] font-bold mt-1">
                <Shield size={11} /> Administrador
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre IC (Personaje)</label>
            <input
              type="text"
              value={nombreIC}
              onChange={e => setNombreIC(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] transition-colors"
              placeholder="Nombre de tu personaje"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Usuario de Discord</label>
            <input
              type="text"
              value={nombreDiscord}
              onChange={e => setNombreDiscord(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] transition-colors"
              placeholder="Tu usuario de Discord (ej. Gam2001204)"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#FDDC03] text-black font-bold px-6 py-2.5 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50 transition-colors"
          >
            <Save size={16} /> {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Cambios"}
          </button>
        </form>
      </div>

      {/* Discord ID */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
          <Link2 size={16} className="text-[#5865F2]" /> Vincular Discord
        </h3>
        <p className="text-gray-500 text-xs mb-4">
          Introduce tu ID numérico de Discord para vincular tu cuenta y recibir notificaciones.<br />
          <span className="text-gray-600">Puedes obtenerlo activando el Modo Desarrollador en Discord → clic derecho en tu nombre → Copiar ID.</span>
        </p>

        {profile?.discordVinculado && (
          <div className="flex items-center gap-2 mb-3 text-green-400 text-sm">
            <CheckCircle size={14} /> Discord vinculado — ID: <span className="font-mono">{profile.discordId}</span>
          </div>
        )}

        <form onSubmit={handleSaveDiscord} className="flex gap-2">
          <input
            type="text"
            value={discordId}
            onChange={e => setDiscordId(e.target.value)}
            className="flex-1 bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#5865F2] transition-colors font-mono"
            placeholder="ID numérico de Discord (ej. 123456789012345678)"
          />
          <button
            type="submit"
            disabled={savingDiscord}
            className="flex items-center gap-2 bg-[#5865F2] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#5865F2]/90 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
          >
            <Link2 size={14} /> {savingDiscord ? "..." : savedDiscord ? "¡Vinculado!" : "Vincular"}
          </button>
        </form>
      </div>

      {/* Roles */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-3">Mis Roles</h3>
        <div className="flex flex-wrap gap-2">
          {profile?.esAdmin && (
            <span className="px-3 py-1 bg-[#FDDC03]/20 text-[#FDDC03] text-xs font-bold rounded-full border border-[#FDDC03]/30">
              Admin
            </span>
          )}
          {profile?.roles?.map(role => (
            <span key={role} className="px-3 py-1 bg-white/10 text-gray-300 text-xs font-medium rounded-full">
              {role}
            </span>
          ))}
          {!profile?.esAdmin && (!profile?.roles || profile.roles.length === 0) && (
            <p className="text-gray-500 text-sm">Sin roles asignados.</p>
          )}
        </div>
      </div>
    </div>
  );
}