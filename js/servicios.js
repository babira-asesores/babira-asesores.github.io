// Pinta los servicios por categoría (servicios.html) o una sola categoría (juridico.html, etc.)
(() => {
  const S = window.SERVICIOS, C = window.CATEGORIAS;
  const fija = document.body.dataset.cat;
  const wa = s => `https://wa.me/5216621245820?text=${encodeURIComponent(`Hola, me interesa el servicio de ${s.titulo}.`)}`;
  const mail = s => `mailto:asesoresbabira@gmail.com?subject=${encodeURIComponent(s.titulo)}&body=${encodeURIComponent(`Hola, me interesa el servicio de ${s.titulo}.`)}`;
  const tarjeta = s => `<article class="ficha-serv" id="${s.id}"><i>${s.icono}</i><h3>${s.titulo}</h3><p>${s.texto}</p>
    <div class="cbtn">${s.enlace ? `<a class="v" href="${s.enlace}">Ver más</a>` : ""}<a class="w" href="${wa(s)}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="m" href="${mail(s)}">✉️ Correo</a></div></article>`;
  const bloque = c => `<section class="cat-bloque" id="cat-${c}"><h2>${C[c].icono} ${C[c].nombre}<small>${C[c].lema}</small></h2>
    <div class="fichas">${S.filter(s => s.categoria === c).map(tarjeta).join("")}</div></section>`;
  const cont = document.getElementById("contenido");
  if (fija) { cont.innerHTML = bloque(fija); return; }
  document.getElementById("cats").innerHTML = `<button class="on" data-c="">Todos</button>` +
    Object.keys(C).map(c => `<button data-c="${c}">${C[c].icono} ${C[c].nombre}</button>`).join("");
  const pintar = c => cont.innerHTML = (c ? [c] : Object.keys(C)).map(bloque).join("");
  document.getElementById("cats").onclick = e => { const b = e.target.closest("button"); if (!b) return;
    document.querySelectorAll("#cats button").forEach(x => x.classList.toggle("on", x === b)); pintar(b.dataset.c); };
  pintar("");
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
