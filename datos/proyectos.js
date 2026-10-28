// Proyectos para inversionistas. Para publicar uno nuevo, copia un bloque y llénalo con datos reales.
// estado: "En evaluación" | "Abierto a inversionistas" | "En ejecución" | "Concluido"
// avances: bitácora pública del proyecto (transparencia). documentos: enlaces a PDFs o carpetas.
window.PROYECTOS = [
  {
    id: "PY-001",
    nombre: "Terreno para desarrollo habitacional · Nogales",
    estado: "En evaluación",
    ciudad: "Nogales, Sonora",
    tipo: "Desarrollo habitacional",
    imagen: "img/casas/BB-013/01.jpg",
    resumen: "Predio de 11,426 m² entre dos zonas ya desarrolladas, con servicios a pie de calle. Valor catastral de $12,721,000; se ofrece por debajo de su valor. Se está evaluando la factibilidad de vivienda de interés social y residencial media.",
    meta: null,            // monto a reunir (MXN) cuando se abra
    reunido: null,         // monto comprometido a la fecha
    ticket_minimo: null,   // inversión mínima por persona
    plazo: null,           // ej. "24 meses"
    rendimiento: null,     // ej. "12–15% anual estimado" (siempre como estimado, nunca garantizado)
    avances: [
      { fecha: "2026-10", texto: "Ficha técnica, plano de ubicación y factibilidad económica preliminar disponibles." },
    ],
    documentos: [],
  },
];
