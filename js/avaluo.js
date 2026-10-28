// Estimador de valor y renta. Orientativo: usa los valores de referencia de datos/valores_zona.js
// y las propiedades comparables del propio inventario.
import { guardarProspecto } from "./fb.js?v=20261029d";

const V = window.VALORES_ZONA, P = window.PROPIEDADES || [];
const $ = s => document.querySelector(s);
const $$ = n => "$" + Math.round(n).toLocaleString("es-MX");
const redondear = n => Math.round(n / 5000) * 5000;
const opciones = o => Object.keys(o).map(k => `<option>${k}</option>`).join("");

$("#eZona").innerHTML = opciones(V.zonas);
$("#eEstado").innerHTML = opciones(V.estado); $("#eEstado").value = "Buena";
$("#eEdad").innerHTML = opciones(V.antiguedad); $("#eEdad").value = "6–15 años";
$("#eExtras").innerHTML = Object.keys(V.extras).map(k => `<label><input type="checkbox" value="${k}"> ${k}</label>`).join("");

let ultimo = "";
$("#fEst").onsubmit = e => {
  e.preventDefault();
  const z = V.zonas[$("#eZona").value];
  const c = +$("#eConst").value || 0, t = +$("#eTerr").value || 0;
  if (!c && !t) return alert("Escribe los m² de construcción o de terreno.");
  const extras = [...document.querySelectorAll("#eExtras input:checked")].map(x => x.value);
  const factor = V.estado[$("#eEstado").value] * V.antiguedad[$("#eEdad").value] * (1 + extras.reduce((s, k) => s + V.extras[k], 0));
  const venta = ($("#eTipo").value === "Terreno" ? 0 : c * z.construccion * factor) + t * z.terreno;
  const [rMin, rMax] = V.renta_mensual;
  const mes = venta * (rMin + rMax) / 2;
  const amueblada = extras.includes("Amueblada");

  $("#res").hidden = false;
  $("#rVenta").textContent = `${$$(redondear(venta * (1 - V.margen)))} – ${$$(redondear(venta * (1 + V.margen)))}`;
  $("#rMes").textContent = $$(Math.round(mes / 500) * 500);
  $("#rAnio").textContent = $$(Math.round(mes * 11.5 / 1000) * 1000); // pago anual adelantado con ~1/2 mes de descuento
  $("#rDia").textContent = amueblada || $("#eTipo").value === "Departamento" ? $$(Math.round(mes / 30 * 1.9 / 50) * 50) : "Solo amuebladas";
  $("#rNota").textContent = `Estimación orientativa con valores de referencia de ${V.actualizado} para ${$("#eZona").value}. No sustituye un avalúo profesional.`;

  // Comparables del inventario de Babira en la misma ciudad/zona
  const [ciudad, zona] = $("#eZona").value.split(" · ");
  const comp = P.filter(p => p.ciudad === ciudad && (!zona || p.zona === zona) && p.precio).slice(0, 4);
  $("#comparables").innerHTML = comp.length ? `<h3>Propiedades similares con Babira</h3>` + comp.map(p =>
    `<div class="renglon"><b>${p.id} · ${p.titulo}</b><span>${p.operacion}</span><span>${$$(p.precio)}${p.operacion === "Renta" ? "/mes" : ""}</span><a href="index.html#catalogo">Ver</a></div>`).join("") : "";
  ultimo = `${$("#eTipo").value} en ${$("#eZona").value}, ${c} m² const., ${t} m² terreno, ${$("#eRec").value || "?"} rec. Estimado ${$("#rVenta").textContent}`;
  $("#res").scrollIntoView({ behavior: "smooth" });
};

$("#fSol").onsubmit = async e => {
  e.preventDefault();
  const d = { nombre: $("#sNom").value, telefono: $("#sTel").value, busca: "Avalúo: " + $("#sMotivo").value, mensaje: ultimo, origen: "estimador" };
  guardarProspecto(d).catch(() => {});
  window.open(`https://wa.me/5216621245820?text=${encodeURIComponent(`Hola, soy ${d.nombre}. Quiero un avalúo (${$("#sMotivo").value}). ${ultimo}`)}`, "_blank");
};
