

import { useState } from "react";

export default function OnboardingModal({ user, onComplete }) {
  const [nombreIC, setNombreIC] = useState("");
  const [nombreDiscord, setNombreDiscord] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreIC.trim() || !nombreDiscord.trim()) {
      setError("Ambos campos son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      // Check if profile exists
      const existing = await db.entities.UserProfile.filter({ userId: user.id });
      if (existing.length > 0) {
        await db.entities.UserProfile.update(existing[0].id, {
          nombreIC: nombreIC.trim(),
          nombreDiscord: nombreDiscord.trim(),
          onboardingCompletado: true,
          primerLogin: false,
        });
      } else {
        await db.entities.UserProfile.create({
          userId: user.id,
          nombreIC: nombreIC.trim(),
          nombreDiscord: nombreDiscord.trim(),
          roles: [],
          esAdmin: false,
          discordVinculado: false,
          onboardingCompletado: true,
          primerLogin: false,
        });
      }
      onComplete();
    } catch (err) {
      setError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="https://media.db.com/images/public/user_6a3ba6ad0262934f09950d74/db51529b6_image.png"
            alt="NorthPoint"
            className="w-16 h-16 object-contain mx-auto mb-3"
          />
          <h2 className="text-2xl font-black text-white">¡Bienvenido a NorthPoint!</h2>
          <p className="text-gray-400 text-sm mt-2">Antes de continuar, configura tu perfil.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre IC (Personaje)
            </label>
            <input
              type="text"
              value={nombreIC}
              onChange={(e) => setNombreIC(e.target.value)}
              placeholder="Nombre de tu personaje en el servidor"
              className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre de Discord
            </label>
            <input
              type="text"
              value={nombreDiscord}
              onChange={(e) => setNombreDiscord(e.target.value)}
              placeholder="Tu usuario de Discord"
              className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FDDC03] text-black font-bold py-3 rounded-lg hover:bg-[#FDDC03]/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}