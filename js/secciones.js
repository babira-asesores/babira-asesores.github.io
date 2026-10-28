// Páginas de sección: Galería (mosaico de las mejores fotos) y Departamentos (amueblados).
const P = (window.PROPIEDADES || []).filter(p => p.estado === "Disponible" || p.estado === "Apartada");
const $ = s => document.querySelector(s);
const WA = "5216621245820";
const msg = p => `Hola, me interesa la propiedad ${p.id}: ${p.titulo}. ¿Sigue disponible?`;
const dinero = n => n ? "$" + n.toLocaleString("es-MX") + (n < 100000 ? " / mes" : "") : "Precio a consultar";
const modo = document.body.dataset.modo;

function abrir(id, desde = 0) {
  const p = P.find(x => x.id === id); let i = desde;
  const fotos = p.fotos.length ? p.fotos : ["img/logo-babira.png"];
  const pintar = () => {
    $("#modalIn").innerHTML = `<button class="cerrar">✕</button>
      <div class="mgal"><img src="${fotos[i]}" alt="${p.titulo}">${fotos.length > 1 ? '<button class="prev">‹</button><button class="next">›</button>' : ""}</div>
      <div class="minfo"><span class="tag ${p.operacion}" style="position:static">${p.operacion.toUpperCase()}</span><h3>${p.titulo}</h3>
      <div class="zona">📍 ${[p.colonia, p.ciudad].filter(Boolean).join(", ")}</div><div class="precio">${dinero(p.precio)}</div><p>${p.descripcion}</p>
      <div class="cbtn"><a class="w" href="https://wa.me/${WA}?text=${encodeURIComponent(msg(p))}" target="_blank" rel="noopener">💬 WhatsApp</a>
      <a class="m" href="mailto:asesoresbabira@gmail.com?subject=${encodeURIComponent("Interés en " + p.id)}&body=${encodeURIComponent(msg(p))}">✉️ Correo</a></div></div>`;
    $(".cerrar").onclick = () => $("#modal").close();
    $(".prev") && ($(".prev").onclick = () => { i = (i - 1 + fotos.length) % fotos.length; pintar(); });
    $(".next") && ($(".next").onclick = () => { i = (i + 1) % fotos.length; pintar(); });
  };
  pintar(); $("#modal").showModal();
}
$("#modal").addEventListener("click", e => { if (e.target === $("#modal")) $("#modal").close(); });

if (modo === "galeria") {
  let op = "";
  const render = () => {
    // Primero la portada de cada propiedad (la mejor foto), después el resto de sus fotos
    const L = P.filter(p => !op || p.operacion === op);
    const portadas = L.filter(p => p.fotos.length).map(p => [p, 0]);
    const resto = L.flatMap(p => p.fotos.slice(1).map((_, k) => [p, k + 1]));
    $("#contenido").innerHTML = [...portadas, ...resto].map(([p, k]) =>
      `<figure data-id="${p.id}" data-k="${k}" class="${k ? "" : "portada"}"><img src="${p.fotos[k]}" alt="${p.titulo}" loading="lazy">
       <figcaption><b>${p.titulo}</b><span>${p.operacion} · ${dinero(p.precio)}</span></figcaption></figure>`).join("");
  };
  $("#filtro").onclick = e => { const b = e.target.closest("button"); if (!b) return; op = b.dataset.v;
    document.querySelectorAll("#filtro button").forEach(x => x.classList.toggle("on", x === b)); render(); };
  $("#contenido").onclick = e => { const f = e.target.closest("figure"); if (f) abrir(f.dataset.id, +f.dataset.k); };
  render();
}

if (modo === "departamentos") {
  const L = P.filter(p => p.tipo === "Departamento" || (p.operacion === "Renta" && /^S[ií]|Equipada|Semi/i.test(p.amueblada)));
  $("#contenido").innerHTML = L.map(p => `<article class="card">
    <div class="foto ${p.fotos[0] ? "" : "sin"}" ${p.fotos[0] ? `style="background-image:url('${p.fotos[0]}')"` : ""} data-id="${p.id}">${p.fotos[0] ? "" : '<img src="img/logo-babira.png" alt="">'}
      <span class="tag Renta">${p.tipo === "Departamento" ? "DEPARTAMENTO" : "AMUEBLADA"}</span></div>
    <div class="body"><h3>${p.titulo}</h3><div class="zona">📍 ${[p.colonia, p.ciudad].filter(Boolean).join(", ")}</div>
      <div class="precio">${p.precio_dia ? "$" + p.precio_dia.toLocaleString("es-MX") + " / noche · " : ""}${dinero(p.precio)}</div>
      <div class="specs">${p.caracteristicas.slice(0, 4).map(s => `<span>${s}</span>`).join("")}</div>
      <div class="cbtn"><a class="w" href="https://wa.me/${WA}?text=${encodeURIComponent(msg(p))}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <a class="m" href="cuenta.html?apartar=${p.id}">📅 Reservar</a><button class="v" data-id="${p.id}">Ver</button></div></div></article>`).join("");
  $("#contenido").onclick = e => { const x = e.target.closest("[data-id]"); if (x) abrir(x.dataset.id); };
}
