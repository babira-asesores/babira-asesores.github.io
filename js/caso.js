// "Cuéntenos su caso": el visitante elige el tipo de problema, lo describe y queda registrado en el embudo.
import { guardarProspecto } from "./fb.js?v=20261031c";

const $ = s => document.querySelector(s);
const WA = "5216621245820", MAIL = "asesoresbabira@gmail.com";
let tipo = "";

$("#cMun").innerHTML += (window.COBERTURA?.municipiosSonora || []).map(m => `<option>${m}</option>`).join("") + "<option>Otro estado</option>";
$("#tiposCaso").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  tipo = b.dataset.t;
  document.querySelectorAll("#tiposCaso button").forEach(x => x.classList.toggle("on", x === b));
});

const datos = () => ({
  nombre: $("#cNom").value.trim(), telefono: $("#cTel").value.trim(), correo: $("#cCorreo").value.trim(),
  busca: "Caso: " + (tipo || "Sin especificar"), zona: $("#cMun").value, mensaje: $("#cDesc").value.trim().slice(0, 1500),
});
const texto = d => `Buen día, mi nombre es ${d.nombre}. Quisiera asesoría sobre: ${d.busca.replace("Caso: ", "")}.` +
  `${d.zona ? ` Inmueble en ${d.zona}.` : ""}\n\n${d.mensaje}\n\nTeléfono: ${d.telefono}${d.correo ? ` · Correo: ${d.correo}` : ""}`;
const registrar = async (d, origen) => {
  if (!tipo) { alert("Por favor seleccione en qué podemos ayudarle."); return false; }
  await guardarProspecto({ ...Object.fromEntries(Object.entries(d).filter(([, v]) => v)), origen }).catch(() => {});
  $("#cOk").hidden = false;
  $("#cOk").textContent = "Gracias. Hemos recibido su caso; un asesor le contactará a la brevedad.";
  return true;
};

$("#fCaso").addEventListener("submit", async e => {
  e.preventDefault();
  const d = datos();
  if (await registrar(d, "su-caso-whatsapp")) window.open(`https://wa.me/${WA}?text=${encodeURIComponent(texto(d))}`, "_blank");
});
$("#cMail").addEventListener("click", async () => {
  if (!$("#fCaso").reportValidity()) return;
  const d = datos();
  if (await registrar(d, "su-caso-correo"))
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Solicitud de asesoría: " + tipo)}&body=${encodeURIComponent(texto(d))}`;
});
