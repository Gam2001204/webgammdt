

import { useState, useEffect } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin } from "@/lib/roles";
import { BookOpen, Upload, Save, FileText, ExternalLink } from "lucide-react";

export default function Normativa() {
  const { profile } = useUserProfile();
  const admin = isAdmin(profile);

  const [config, setConfig] = useState(null);
  const [texto, setTexto] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.AppConfig.filter({ key: "normativa_texto" }),
      db.entities.AppConfig.filter({ key: "normativa_pdf" }),
    ]).then(([textoRes, pdfRes]) => {
      if (textoRes[0]) { setConfig(textoRes[0]); setTexto(textoRes[0].value || ""); }
      if (pdfRes[0]) setPdfUrl(pdfRes[0].value || "");
    });
  }, []);

  const handleUploadPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    // Save to AppConfig
    const existing = await db.entities.AppConfig.filter({ key: "normativa_pdf" });
    if (existing[0]) {
      await db.entities.AppConfig.update(existing[0].id, { value: file_url });
    } else {
      await db.entities.AppConfig.create({ key: "normativa_pdf", value: file_url });
    }
    setPdfUrl(file_url);
    setUploading(false);
  };

  const handleSaveTexto = async () => {
    setSaving(true);
    if (config?.id) {
      await db.entities.AppConfig.update(config.id, { value: texto });
    } else {
      const created = await db.entities.AppConfig.create({ key: "normativa_texto", value: texto });
      setConfig(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BookOpen size={22} className="text-[#FDDC03]" /> Normativa
        </h1>
        <p className="text-gray-400 text-sm mt-1">Normas y reglamento de NorthPoint Roleplay.</p>
      </div>

      {/* Texto */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <FileText size={16} className="text-[#FDDC03]" /> Descripción / Normativa
          </h2>
          {admin && (
            <button
              onClick={handleSaveTexto}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#FDDC03] text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50 transition-colors"
            >
              <Save size={13} /> {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar"}
            </button>
          )}
        </div>
        {admin ? (
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={10}
            placeholder="Escribe aquí la normativa del servidor, reglas de los comercios, etc..."
            className="w-full bg-[#0D0D0D] border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] transition-colors resize-none"
          />
        ) : (
          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed min-h-[80px]">
            {texto || <span className="text-gray-600">Sin normativa publicada todavía.</span>}
          </div>
        )}
      </div>

      {/* PDF */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <FileText size={16} className="text-[#FDDC03]" /> Documento PDF
          </h2>
          {admin && (
            <label className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploading ? "bg-white/10 text-gray-400" : "bg-white/10 text-white hover:bg-white/20"}`}>
              <Upload size={13} /> {uploading ? "Subiendo..." : "Subir PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadPDF} disabled={uploading} />
            </label>
          )}
        </div>

        {pdfUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs font-medium">● PDF cargado</span>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#FDDC03] hover:underline">
                <ExternalLink size={11} /> Abrir en nueva pestaña
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: "600px" }}>
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Normativa PDF"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{admin ? "Sube un PDF para mostrarlo aquí." : "No hay documento publicado todavía."}</p>
          </div>
        )}
      </div>
    </div>
  );
}