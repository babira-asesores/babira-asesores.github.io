// Catálogo de servicios de Babira. Para agregar uno nuevo, copia un bloque y cambia los textos.
// categoria: inmobiliario | juridico | financiero | inversion
// portada: true → aparece en los accesos rápidos de la página principal
window.SERVICIOS = [
  // ---------- Inmobiliario ----------
  { id: "compraventa", categoria: "inmobiliario", icono: "🔑", titulo: "Compra-venta de inmuebles", portada: true, enlace: "index.html#catalogo",
    texto: "Casas, terrenos, departamentos y locales. Te acompañamos desde la búsqueda hasta la firma en notaría." },
  { id: "rentas", categoria: "inmobiliario", icono: "🏠", titulo: "Rentas por día, mes o año", portada: true, enlace: "departamentos.html",
    texto: "Casas y departamentos amueblados o sin amueblar, con opciones sin aval y estancias cortas." },
  { id: "administracion", categoria: "inmobiliario", icono: "📋", titulo: "Administración de propiedades",
    texto: "Promoción, filtro de inquilinos, contratos, cobranza y mantenimiento. Tu propiedad trabajando para ti." },
  { id: "rehabilitacion", categoria: "inmobiliario", icono: "🛠️", titulo: "Rehabilitación de propiedades",
    texto: "Recuperamos casas abandonadas, invadidas o deterioradas: limpieza, reparación y puesta en valor para rentar o vender." },
  { id: "avaluos", categoria: "inmobiliario", icono: "📐", titulo: "Avalúos y estimación de valor", portada: true, enlace: "avaluo.html",
    texto: "Calcula gratis cuánto vale tu casa y solicita un avalúo para venta, crédito, herencia o juicio." },

  // ---------- Jurídico ----------
  { id: "juridica", categoria: "juridico", icono: "⚖️", titulo: "Asesoría jurídica inmobiliaria", portada: true,
    texto: "Revisión de escrituras y documentos antes de comprar, contratos de compra-venta y arrendamiento." },
  { id: "problemas", categoria: "juridico", icono: "🧩", titulo: "Solución de problemas jurídicos",
    texto: "Propiedades con adeudos, gravámenes, invasiones, dobles ventas o documentos irregulares. Analizamos tu caso y te damos una ruta." },
  { id: "desalojos", categoria: "juridico", icono: "🚪", titulo: "Desalojos", portada: true,
    texto: "Recupera tu propiedad de inquilinos morosos u ocupantes sin derecho, por la vía legal y con acompañamiento en cada etapa." },
  { id: "sucesorios", categoria: "juridico", icono: "📜", titulo: "Juicios sucesorios", portada: true,
    texto: "Herencias, testamentarias e intestados: regularizamos la propiedad a nombre de los herederos para que puedan venderla o habitarla." },
  { id: "tramitologia", categoria: "juridico", icono: "🗂️", titulo: "Tramitología",
    texto: "Escrituración, predial, catastro, certificados de libertad de gravamen, constancias y regularización ante dependencias." },
  { id: "express", categoria: "juridico", icono: "⚡", titulo: "Trámites express", portada: true,
    texto: "¿Lo necesitas ya? Gestionamos tus trámites inmobiliarios con prioridad y te mantenemos al tanto del avance." },

  // ---------- Financiero ----------
  { id: "creditos", categoria: "financiero", icono: "🏦", titulo: "Créditos hipotecarios", portada: true,
    texto: "Infonavit y todos los créditos bancarios del mercado. Comparamos opciones y tramitamos por ti." },
  { id: "financiera", categoria: "financiero", icono: "💼", titulo: "Asesoría financiera",
    texto: "Cuánto puedes comprar, cómo mejorar tu perfil de crédito y qué esquema de pago te conviene." },

  // ---------- Inversión ----------
  { id: "inversion", categoria: "inversion", icono: "📈", titulo: "Propiedades de inversión",
    texto: "Casas y departamentos para rentar o revender con buen rendimiento. Te ayudamos a calcular cuánto te deja cada uno." },
  { id: "remates", categoria: "inversion", icono: "🏷️", titulo: "Viviendas adjudicadas y remates",
    texto: "Oportunidades por debajo del valor comercial, con acompañamiento legal en todo el proceso." },
  { id: "desarrollo", categoria: "inversion", icono: "🏗️", titulo: "Desarrollo de proyectos",
    texto: "Terrenos para desarrollo, estudios de factibilidad y búsqueda de socios e inversionistas." },
];

window.CATEGORIAS = {
  inmobiliario: { nombre: "Inmobiliario", icono: "🏡", lema: "Comprar, vender, rentar y cuidar tu patrimonio" },
  juridico: { nombre: "Jurídico y trámites", icono: "⚖️", lema: "Resolvemos lo legal para que tu propiedad esté en regla" },
  financiero: { nombre: "Créditos y finanzas", icono: "🏦", lema: "El crédito correcto, sin vueltas" },
  inversion: { nombre: "Inversión", icono: "📈", lema: "Haz crecer tu dinero con bienes raíces" },
};
