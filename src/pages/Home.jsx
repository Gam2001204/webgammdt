

import { useState, useEffect } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin, isJefeOf } from "@/lib/roles";
import { formatDate } from "@/lib/constants";
import { Plus, Megaphone, Building2, Circle, Pencil, Trash2 } from "lucide-react";

export default function Home() {
  const { profile, businesses, user } = useUserProfile();
  const [announcements, setAnnouncements] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [saving, setSaving] = useState(false);

  const admin = isAdmin(profile);
  const canPost = admin || businesses?.some(b => isJefeOf(profile, b.nombre));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ann, sh] = await Promise.all([
      db.entities.Announcement.list("-fecha", 20),
      db.entities.ServiceShift.filter({ activo: true }),
    ]);
    setAnnouncements(ann);
    setShifts(sh);
  };

  const openBusinessIds = new Set(shifts.map(s => s.businessId));

  const handlePost = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setSaving(true);
    await db.entities.Announcement.create({
      userId: user?.id,
      userNombreIC: profile?.nombreIC || user?.email,
      businessNombre: "",
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipo: admin ? "editorial" : "anuncio",
      fecha: new Date().toISOString(),
    });
    setTitulo(""); setContenido(""); setShowForm(false);
    setSaving(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar anuncio?")) return;
    await db.entities.Announcement.delete(id);
    loadData();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="bg-[#1A1A1A] border border-[#FDDC03]/30 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <img
            src="https://media.db.com/images/public/user_6a3ba6ad0262934f09950d74/db51529b6_image.png"
            alt="NorthPoint" className="w-14 h-14 object-contain"
          />
          <div>
            <h1 className="text-2xl font-black text-white">
              Bienvenido, <span className="text-[#FDDC03]">{profile?.nombreIC || user?.email || "Civil"}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">NorthPoint Roleplay · MDT Comercios</p>
          </div>
        </div>
      </div>

      {/* Business status */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-[#FDDC03]" /> Estado de Negocios
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {businesses?.map(b => {
            const open = openBusinessIds.has(b.id);
            return (
              <div key={b.id} className="flex items-center gap-2 bg-[#0D0D0D] rounded-lg px-3 py-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.colorHEX }} />
                <span className="text-white text-xs font-medium flex-1 truncate">{b.nombre}</span>
                <span className={`text-xs font-bold ${open ? "text-green-400" : "text-gray-500"}`}>
                  {open ? "Abierto" : "Cerrado"}
                </span>
              </div>
            );
          })}
          {(!businesses || businesses.length === 0) && (
            <p className="col-span-3 text-gray-500 text-sm">No hay negocios registrados.</p>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone size={18} className="text-[#FDDC03]" /> Anuncios
          </h2>
          {canPost && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-[#FDDC03] text-black text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-[#FDDC03]/90 transition-colors"
            >
              <Plus size={14} /> Publicar
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handlePost} className="mb-4 space-y-3 bg-[#0D0D0D] rounded-xl p-4">
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título del anuncio"
              className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03]"
            />
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder="Contenido del anuncio..."
              rows={3}
              className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FDDC03] resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-[#FDDC03] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#FDDC03]/90 disabled:opacity-50">
                {saving ? "Publicando..." : "Publicar"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:bg-white/10">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-[#0D0D0D] rounded-xl p-4 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {ann.titulo && <h3 className="text-white font-bold text-sm mb-1">{ann.titulo}</h3>}
                  <p className="text-gray-300 text-sm">{ann.contenido}</p>
                  <p className="text-gray-500 text-xs mt-2">{ann.userNombreIC} · {formatDate(ann.fecha)}</p>
                </div>
                {admin && (
                  <button onClick={() => handleDelete(ann.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No hay anuncios todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}