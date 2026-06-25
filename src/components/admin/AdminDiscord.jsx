

import { useState, useEffect } from "react";

import { Save, Send, CheckCircle, AlertCircle, Hash } from "lucide-react";

// We store webhook config in a single AppConfig record
const CONFIG_KEY = "discord_webhook";

export default function AdminDiscord() {
  const [webhook, setWebhook] = useState("");
  const [savedWebhook, setSavedWebhook] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | "ok" | "error"
  const [configId, setConfigId] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const configs = await db.entities.AppConfig.filter({ key: CONFIG_KEY });
    if (configs[0]) {
      setWebhook(configs[0].value || "");
      setSavedWebhook(configs[0].value || "");
      setConfigId(configs[0].id);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (configId) {
      await db.entities.AppConfig.update(configId, { value: webhook.trim() });
    } else {
      const created = await db.entities.AppConfig.create({ key: CONFIG_KEY, value: webhook.trim() });
      setConfigId(created.id);
    }
    setSavedWebhook(webhook.trim());
    setSaving(false);
  };

  const handleTest = async () => {
    if (!savedWebhook) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(savedWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "✅ Webhook configurado correctamente",
            description: "La conexión con NorthPoint MDT Comercios está activa.",
            color: 0xFDDC03,
            footer: { text: "NorthPoint Roleplay — MDT Comercios" },
          }]
        }),
      });
      setTestResult(res.ok ? "ok" : "error");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Hash size={18} className="text-[#5865F2]" /> Notificaciones Discord
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Configura un webhook de Discord para recibir avisos automáticos de sanciones, apelaciones y convenios.
        </p>
      </div>

      {/* Setup instructions */}
      <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl p-5 space-y-2">
        <p className="text-[#5865F2] font-bold text-sm">¿Cómo crear un webhook?</p>
        <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
          <li>Ve al canal de Discord donde quieres recibir las notificaciones.</li>
          <li>Haz clic en el engranaje (Editar canal) → Integraciones → Webhooks.</li>
          <li>Crea un nuevo webhook, cópialo y pégalo aquí abajo.</li>
        </ol>
      </div>

      <form onSubmit={handleSave} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL del Webhook</label>
          <input
            type="url"
            value={webhook}
            onChange={e => setWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#5865F2] transition-colors font-mono"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !webhook.trim()}
            className="flex items-center gap-2 bg-[#5865F2] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#5865F2]/90 disabled:opacity-50 transition-colors text-sm"
          >
            <Save size={14} /> {saving ? "Guardando..." : "Guardar Webhook"}
          </button>
          {savedWebhook && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 bg-white/10 text-gray-300 font-bold px-5 py-2.5 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-colors text-sm"
            >
              <Send size={14} /> {testing ? "Enviando..." : "Probar"}
            </button>
          )}
        </div>
        {testResult === "ok" && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={14} /> Mensaje enviado correctamente al canal de Discord.
          </div>
        )}
        {testResult === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} /> Error al enviar. Verifica que la URL del webhook sea correcta.
          </div>
        )}
      </form>

      {/* Notification events info */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <p className="text-white font-bold text-sm mb-3">Eventos que generan notificaciones</p>
        <div className="space-y-2">
          {[
            { emoji: "⚠️", label: "Nueva sanción emitida a un negocio" },
            { emoji: "📢", label: "Un negocio apela una sanción" },
            { emoji: "✅", label: "Apelación aprobada o denegada" },
            { emoji: "🤝", label: "Nuevo convenio solicitado entre negocios" },
            { emoji: "📊", label: "Informe de sociedad enviado" },
          ].map(ev => (
            <div key={ev.label} className="flex items-center gap-3 text-sm">
              <span>{ev.emoji}</span>
              <span className="text-gray-400">{ev.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}