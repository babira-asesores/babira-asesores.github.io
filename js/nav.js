// Menú compartido por todas las páginas públicas. Para agregar una pestaña nueva, añádela aquí.
(() => {
  const PESTANAS = [
    ["index.html", "Inicio"],
    ["index.html#catalogo", "Propiedades"],
    ["departamentos.html", "Departamentos"],
    ["servicios.html", "Servicios"],
    ["juridico.html", "Jurídico"],
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
    <a href="index.html" class="marca"><img src="img/logo-babira.png" alt="Babira Asesores"><span>BABIRA<small>ASESORES · BIENES RAÍCES</small></span></a>
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
