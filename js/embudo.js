// Embudo del sitio público: asesor IA, captura de prospectos y botón de apartado.
import { firebaseListo } from "./config.js";
import { guardarProspecto } from "./fb.js";

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
  d.innerHTML = d.innerHTML.replace(/\b(BB-\d{3})\b/g, '<a data-ver="$1">$1</a>');
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
    const r = await fetch("/api/asesor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensajes: historial, sesion }) });
    const { respuesta } = await r.json();
    esperando.remove(); pintar(respuesta, "ia");
    historial.push({ role: "assistant", content: respuesta });
  } catch {
    esperando.remove(); pintar("Se cortó la conexión. Escríbenos por WhatsApp al 662 124 5820.", "ia");
  }
};
