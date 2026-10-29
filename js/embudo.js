// Embudo del sitio público: asesor IA, captura de prospectos y botón de apartado.
import { firebaseListo } from "./config.js?v=20261031a";
import { guardarProspecto, gemini } from "./fb.js?v=20261031a";

const $ = s => document.querySelector(s);
const WA = "https://wa.me/5216621245820";

// --- Formulario de contacto: además de abrir WhatsApp/correo, queda registrado en el embudo
const form = $("#form");
const datosForm = origen => ({
  nombre: $("#nom").value, busca: $("#busca").value, presupuesto: $("#pres").value,
  zona: $("#zona").value, mensaje: $("#msg").value, origen,
});
form.addEventListener("submit", () => guardarProspecto(datosForm("formulario-whatsapp")).catch(() => {}));
$("#porCorreo").addEventListener("click", () => form.checkValidity() && guardarProspecto(datosForm("formulario-correo")).catch(() => {}));

// --- Botón "Apartar" en las casas en renta (lleva a Mi cuenta con la casa elegida)
const ponerApartar = () => document.querySelectorAll(".card").forEach(c => {
  const id = c.querySelector("[data-ver]")?.dataset.ver;
  const p = (window.PROPIEDADES || []).find(x => x.id === id);
  if (!p || p.operacion !== "Renta" || c.querySelector(".apartar")) return;
  const a = document.createElement("a");
  a.className = "apartar"; a.href = `cuenta.html?apartar=${id}`; a.textContent = "🔒 Apartar en línea";
  c.querySelector(".cbtn").after(a);
});
new MutationObserver(ponerApartar).observe($("#grid"), { childList: true });
ponerApartar();

// --- Asesor virtual con IA
const historial = [];
const sesion = (() => { try { return localStorage.babiraSesion ||= crypto.randomUUID(); } catch { return crypto.randomUUID(); } })();
const pintar = (txt, quien) => {
  const d = document.createElement("div");
  d.className = "m " + quien;
  d.textContent = txt;
  d.innerHTML = d.innerHTML
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")          // negritas del asesor
    .replace(/^\s*[-*]\s+/gm, "• ")                  // viñetas
    .replace(/\b(BB-\d{3})\b/g, '<a data-ver="$1">$1</a>');
  $("#chatMsgs").append(d); $("#chatMsgs").scrollTop = 1e6;
  return d;
};
$("#chatBtn").onclick = () => { $("#chat").hidden = !$("#chat").hidden; if (!$("#chat").hidden) $("#chatTxt").focus(); };
$("#chatX").onclick = () => ($("#chat").hidden = true);
$("#chatForm").onsubmit = async e => {
  e.preventDefault();
  const txt = $("#chatTxt").value.trim(); if (!txt) return;
  $("#chatTxt").value = ""; pintar(txt, "yo");
  historial.push({ role: "user", content: txt });
  if (!firebaseListo()) {
    const a = pintar("El asesor automático se activa muy pronto. Mientras, Betty te atiende por WhatsApp 👇", "ia");
    a.insertAdjacentHTML("beforeend", `<br><a href="${WA}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">💬 Continuar en WhatsApp</a>`);
    return;
  }
  const esperando = pintar("Escribiendo…", "ia esp");
  try {
    chat ||= (await gemini(instrucciones()))?.startChat();
    // Si Gemini está saturado (error temporal), reintenta hasta 3 veces con espera creciente
    let r;
    for (let i = 0; ; i++) {
      try { r = await chat.sendMessage(txt); break; }
      catch (err) {
        if (i >= 2 || !/\[(429|500|503)/.test(err.message)) throw err;
        await new Promise(ok => setTimeout(ok, 2000 * (i + 1)));
      }
    }
    let respuesta = r.response.text().trim();
    // El asesor marca los datos del cliente en una línea PROSPECTO: {...}; se guarda en el embudo y no se muestra
    const m = respuesta.match(/PROSPECTO:\s*(\{[^\n]*\})/);
    if (m) {
      respuesta = respuesta.replace(m[0], "").trim();
      try {
        const d = JSON.parse(m[1]);
        const permitidos = ["nombre", "telefono", "correo", "busca", "presupuesto", "zona", "propiedad"];
        await guardarProspecto({ ...Object.fromEntries(permitidos.filter(k => d[k]).map(k => [k, String(d[k]).slice(0, 200)])), origen: "asesor-ia" });
      } catch { /* línea mal formada */ }
    }
    // Respuestas rápidas sugeridas por el asesor (OPCIONES: a | b | c) → botones para seguir la plática
    let opciones = [];
    const o = respuesta.match(/OPCIONES:\s*([^\n]+)/);
    if (o) { opciones = o[1].split("|").map(s => s.trim()).filter(Boolean).slice(0, 4); respuesta = respuesta.replace(o[0], "").trim(); }
    esperando.remove(); pintar(respuesta, "ia");
    if (opciones.length) {
      const fila = document.createElement("div");
      fila.className = "rapidas";
      opciones.forEach(t => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; fila.append(b); });
      $("#chatMsgs").append(fila); $("#chatMsgs").scrollTop = 1e6;
    }
    historial.push({ role: "assistant", content: respuesta });
  } catch (e) {
    console.error(e);
    esperando.remove(); pintar("Por el momento no fue posible responder. Con gusto le atendemos por WhatsApp al 662 124 5820.", "ia");
  }
};

// Tocar una respuesta rápida la envía como si la persona la hubiera escrito
$("#chatMsgs").addEventListener("click", e => {
  const b = e.target.closest(".rapidas button"); if (!b) return;
  b.parentElement.remove(); $("#chatTxt").value = b.textContent; $("#chatForm").requestSubmit();
});

let chat;
function instrucciones() {
  const inv = (window.PROPIEDADES || []).filter(p => p.estado === "Disponible" || p.estado === "Apartada")
    .map(p => `- ${p.id} | ${p.operacion} | ${p.tipo} | ${p.titulo} | ${p.colonia || ""}, ${p.ciudad} (${p.zona || "s/zona"}) | ` +
      `${p.precio ? "$" + p.precio.toLocaleString("es-MX") + (p.operacion === "Renta" ? " al mes" : "") : "precio a consultar"}` +
      `${p.precio_dia ? " | $" + p.precio_dia.toLocaleString("es-MX") + " por día" : ""}${p.precio_anual ? " | $" + p.precio_anual.toLocaleString("es-MX") + " por año" : ""} | ` +
      `${p.recamaras || "-"} rec, ${p.banos || "-"} baños | ${p.caracteristicas.join(", ")} | ${p.condiciones || ""}`).join("\n");
  return `Eres el asesor virtual de Babira Asesores Bienes Raíces (Hermosillo y Nogales, Sonora). Atendemos en todo México y somos especialistas en Sonora (sus 72 municipios: Hermosillo, Guaymas-San Carlos, Nogales, Cajeme-Cd. Obregón, Puerto Peñasco, San Luis Río Colorado, Navojoa, Bahía de Kino y más). Nuestra especialidad es la ADMINISTRACIÓN DE RENTAS (planes Colocación Segura, Administración Total y Renta Blindada) y la ASESORÍA JURÍDICA inmobiliaria; si hablas con un propietario, ofrécele un diagnóstico gratuito de su propiedad. Más de 16 años de experiencia; Beatriz Aranda es la CEO y asesora inmobiliaria de la empresa. Servicios: compra-venta de casas, terrenos, departamentos y locales; rentas por día, mes o año (solo de las propiedades del inventario); administración de propiedades; avalúos y estimación de valor (hay un estimador gratuito en avaluo.html); créditos hipotecarios (Infonavit, Fovissste y bancarios); asesoría legal y financiera (escrituras, contratos, sucesiones); viviendas adjudicadas y remates; desarrollo de proyectos e inversión.

Cómo conducir la conversación (es una entrevista guiada, no un buscador):
1. Haz UNA sola pregunta por mensaje y termina SIEMPRE con esa pregunta, para que la persona siga respondiendo. Nunca cierres un mensaje sin pregunta.
2. Primero identifica el perfil: ¿busca dónde vivir, es propietario, tiene un problema legal o quiere invertir?
3. Según el perfil, avanza paso a paso:
   - Busca inmueble: renta o compra → ciudad/zona → presupuesto → recámaras → mascotas o fecha de mudanza → recomienda.
   - Propietario: ubicación del inmueble → ¿ya está rentado? → ¿quién lo administra hoy y qué le preocupa? → explica el plan adecuado.
   - Problema legal: qué ocurre → desde cuándo → si cuenta con contrato/escrituras → ofrece revisión del caso con el área jurídica.
   - Inversión: monto aproximado → tipo de inversión → plazo.
4. Recomienda SOLO propiedades del inventario de abajo, citando su clave (ej. BB-006). Si ninguna encaja, dilo con honestidad y ofrece que Betty busque opciones.
5. Cuando haya interés real, solicita nombre y celular para que un asesor le dé seguimiento. Al tenerlos, agrega al final una línea exacta:
PROSPECTO: {"nombre":"...","telefono":"...","busca":"...","zona":"...","presupuesto":"...","propiedad":"BB-xxx"}
6. Al final de cada mensaje agrega una línea con 2 a 4 respuestas cortas sugeridas para que la persona toque una, en este formato exacto:
OPCIONES: opción 1 | opción 2 | opción 3
7. Para apartar, pagar o reservar, indica la sección "Mi cuenta" del sitio.

Estilo: español de México, trato de USTED, tono profesional, cordial y formal; breve (máximo 4 líneas antes de la pregunta). No inventes precios, propiedades ni datos legales. Para dudas legales o de crédito específicas ofrece asesoría con el equipo: Betty Aranda (662 124 5820), Sra. Olga Álvarez Romo (662 282 7722) o Martha López García (662 295 7300), o al correo asesoresbabira@gmail.com.

INVENTARIO ACTUAL:
${inv}`;
}
