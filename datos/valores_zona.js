// Valores de referencia para el estimador de valor (MXN por m²). AJUSTAR con la experiencia de Betty.
// Son puntos de partida aproximados para Hermosillo y Nogales, no un avalúo.
window.VALORES_ZONA = {
  actualizado: "2026-10",
  zonas: {
    "Hermosillo · Norte":    { construccion: 16000, terreno: 4500 },
    "Hermosillo · Poniente": { construccion: 18500, terreno: 5500 },
    "Hermosillo · Centro":   { construccion: 13000, terreno: 4500 },
    "Hermosillo · Oriente":  { construccion: 12000, terreno: 3200 },
    "Hermosillo · Sur":      { construccion: 10500, terreno: 2800 },
    "Nogales":               { construccion: 10000, terreno: 1800 },
    "Bahía de Kino":         { construccion: 14000, terreno: 3500 },
  },
  // Ajustes multiplicadores
  estado: { "Excelente / remodelada": 1.10, "Buena": 1.0, "Regular": 0.88, "Requiere reparaciones": 0.72 },
  antiguedad: { "Nueva (0–5 años)": 1.05, "6–15 años": 1.0, "16–30 años": 0.9, "Más de 30 años": 0.8 },
  extras: { "Privada / acceso controlado": 0.06, "Alberca": 0.05, "Minisplits": 0.02, "Cochera techada": 0.02, "Amueblada": 0.03 },
  // Rendimiento bruto mensual típico de renta sobre el valor
  renta_mensual: [0.0045, 0.006],
  margen: 0.10, // ± rango mostrado
};
