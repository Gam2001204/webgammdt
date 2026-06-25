export const BADULAQUE_ITEMS = [
  { nombre: "Botella de Agua", precio: 1 },
  { nombre: "Refresco de Cola", precio: 2 },
  { nombre: "Refresco de Naranja", precio: 2 },
  { nombre: "Refresco de Té", precio: 2 },
  { nombre: "Zumo de Naranja", precio: 2 },
  { nombre: "Zumo de Piña", precio: 2 },
  { nombre: "Cerveza", precio: 3 },
  { nombre: "Bocadillo", precio: 4 },
  { nombre: "Sandwich", precio: 3 },
  { nombre: "Snack Patatas", precio: 2 },
  { nombre: "Chocolate", precio: 2 },
  { nombre: "Caramelos", precio: 1 },
  { nombre: "Chicles", precio: 1 },
  { nombre: "Tabaco", precio: 5 },
  { nombre: "Mechero", precio: 2 },
  { nombre: "Periódico", precio: 1 },
  { nombre: "Café", precio: 2 },
  { nombre: "Té", precio: 2 },
];

export const OCIO_ITEMS = [
  { nombre: "Cerveza", precio: 4 },
  { nombre: "Champagne", precio: 15 },
  { nombre: "Vino Tinto", precio: 8 },
  { nombre: "Vino Blanco", precio: 8 },
  { nombre: "Whisky", precio: 10 },
  { nombre: "Vodka", precio: 10 },
  { nombre: "Ron", precio: 10 },
  { nombre: "Gin Tonic", precio: 12 },
  { nombre: "Mojito", precio: 12 },
  { nombre: "Daiquiri", precio: 12 },
  { nombre: "Combinado", precio: 10 },
  { nombre: "Refresco", precio: 3 },
  { nombre: "Agua", precio: 2 },
  { nombre: "Café", precio: 3 },
  { nombre: "Chupito", precio: 5 },
  { nombre: "Botella Premium", precio: 80 },
  { nombre: "Copa de Cava", precio: 8 },
];

export const MECHANIC_BASE_PRICES = {
  completo: 5550,
  reparacion: 150,
  gruaA: 25,
  gruaB: 35,
  gruaC: 45,
  pinturaUnidad: 100,
  piezasUnidad: 100,
  motor: 1480,
  frenos: 925,
  suspension: 925,
  transmision: 925,
  turbo: 1925,
  blindaje: 314.5,
  precioBaseAsbo: 18500,
};

export const RANDOM_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8C471", "#82E0AA", "#F1948A", "#AED6F1", "#A9DFBF",
  "#FAD7A0", "#D2B4DE", "#A3E4D7", "#FADBD8", "#D6EAF8",
];

export const getRandomColor = () =>
  RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

export const calcMechanicPrice = (basePrice, vehiclePrice, asboBase = 18500) =>
  Math.round((basePrice / asboBase) * vehiclePrice * 100) / 100;

export const formatCurrency = (amount) =>
  `$${Number(amount).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
};