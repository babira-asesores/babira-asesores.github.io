// Menú compartido por todas las páginas públicas. Para agregar una pestaña nueva, añádela aquí.
(() => {
  const PESTANAS = [
    ["index.html", "Inicio"],
    ["index.html#propietarios", "Propietarios"],
    ["index.html#catalogo", "Propiedades"],
    ["departamentos.html", "Departamentos"],
    ["servicios.html", "Servicios"],
    ["juridico.html", "Jurídico"],
    ["index.html#caso", "Su caso"],
    ["avaluo.html", "Avalúos"],
    ["inversionistas.html", "Inversionistas"],
    ["betty.html", "Betty Aranda"],
    ["galeria.html", "Galería"],
    ["historial.html", "Historial"],
  ];
  const actual = location.pathname.split("/").pop() || "index.html";
  const h = document.getElementById("topnav");
  if (!h) return;
  h.innerHTML = `<div class="nav">
    <a href="index.html" class="marca"><img src="img/logo-b.png" alt="Babira Asesores"><span>BABIRA ASESORES<small>BIENES RAÍCES</small></span></a>
    <nav class="links" id="menu">${PESTANAS.map(([u, t]) =>
      `<a href="${u}" class="${u === actual ? "activa" : ""}">${t}</a>`).join("")}<a href="cuenta.html" class="cta-cuenta">👤 Mi cuenta</a></nav>
    <div class="acciones">
      <a class="b-wa" href="https://wa.me/5216621245820?text=${encodeURIComponent("Hola, vi su página web y quiero información.")}" target="_blank" rel="noopener">💬 <span>WhatsApp</span></a>
      <a class="b-mail" href="mailto:asesoresbabira@gmail.com?subject=Informaci%C3%B3n">✉️ <span>Correo</span></a>
      <button class="hamb" id="hamb" aria-label="Abrir menú" aria-expanded="false">☰</button>
    </div></div>`;
  const menu = document.getElementById("menu"), b = document.getElementById("hamb");
  b.onclick = () => { const a = menu.classList.toggle("abierto"); b.setAttribute("aria-expanded", a); b.textContent = a ? "✕" : "☰"; };
  menu.onclick = e => { if (e.target.tagName === "A") { menu.classList.remove("abierto"); b.textContent = "☰"; } };
})();

// ===== Animaciones: aparición al hacer scroll, fotos que rotan, botones con reacción =====
(() => {
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SEL = ".card,.preg,.plan,.serv,.ficha-serv,.esp,.acceso,.proy,.mosaico figure,.caso-txt,.caso-form,.cobertura,.propietarios>h2,.propietarios>.intro,.banda,.pasos>div,.kpi,main h2,.datos,form";
  const io = reducir ? null : new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  const preparar = raiz => raiz.querySelectorAll(SEL).forEach((el, i) => {
    if (el.dataset.anim) return;
    el.dataset.anim = 1;
    if (!io) return;
    el.classList.add("aparece");
    el.style.transitionDelay = `${(i % 6) * 70}ms`;
    io.observe(el);
  });
  const iniciar = () => {
    preparar(document);
    // Contenido que se pinta después (catálogo, filtros, galerías)
    new MutationObserver(() => preparar(document)).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", iniciar) : iniciar();

  // Encabezado compacto al bajar
  addEventListener("scroll", () => document.getElementById("topnav")?.classList.toggle("compacto", scrollY > 40), { passive: true });

  // Botones: onda al tocar
  document.addEventListener("pointerdown", e => {
    const b = e.target.closest(".btn,.b-wa,.b-mail,.acceso,.cbtn a,.cbtn button,.tipos button,.chips button,.flot a");
    if (!b || reducir) return;
    const r = b.getBoundingClientRect(), o = document.createElement("i");
    o.className = "onda";
    o.style.left = `${e.clientX - r.left}px`; o.style.top = `${e.clientY - r.top}px`;
    b.appendChild(o); setTimeout(() => o.remove(), 600);
  });

  // Fotos de las tarjetas: al pasar el cursor rotan con transición suave
  const fotos = id => (window.PROPIEDADES || []).find(p => p.id === id)?.fotos || [];
  let timer;
  document.addEventListener("mouseover", e => {
    const f = e.target.closest(".card .foto[data-ver]");
    if (!f || f.dataset.rotando || reducir) return;
    const lista = fotos(f.dataset.ver); if (lista.length < 2) return;
    f.dataset.rotando = 1; let i = 0;
    const capa = document.createElement("div"); capa.className = "foto-capa"; f.prepend(capa);
    timer = setInterval(() => {
      i = (i + 1) % lista.length;
      capa.style.backgroundImage = `url('${lista[i]}')`; capa.classList.remove("ver"); void capa.offsetWidth; capa.classList.add("ver");
    }, 1400);
    f.addEventListener("mouseleave", () => { clearInterval(timer); capa.remove(); delete f.dataset.rotando; }, { once: true });
  });
})();
