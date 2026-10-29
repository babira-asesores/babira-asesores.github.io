import { fb } from "./fb.js?v=20261031d";

const $ = s => document.querySelector(s);
const P = window.PROPIEDADES || [];
const ETAPAS = ["Nuevo", "Contactado", "Visita agendada", "Negociación", "Cerrado", "Perdido"];
const fecha = t => t?.toDate ? t.toDate().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const aviso = t => { $("#aviso").textContent = t; $("#aviso").className = "aviso error"; $("#aviso").hidden = false; };

navigator.serviceWorker?.register("sw.js").catch(() => {});
const f = await fb();
if (!f) aviso("Falta conectar Firebase (js/config.js). Revisa la guía de activación.");
else {
  const { auth, A, db, F } = f;
  $("#google").onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider());
  $("#salir").onclick = () => A.signOut(auth);

  document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
    document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
    document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== b.dataset.t);
  });

  A.onAuthStateChanged(auth, async u => {
    $("#vLogin").hidden = !!u; $("#salir").hidden = !u; $("#vPanel").hidden = true;
    if (!u) return;
    const admin = await F.getDoc(F.doc(db, "admins", u.uid)).catch(() => null);
    if (!admin?.exists()) return aviso(`Tu cuenta (${u.email}) no es administradora. Agrega tu UID ${u.uid} a la colección "admins" en Firebase.`);
    $("#aviso").hidden = true; $("#vPanel").hidden = false;
    iniciar();
  });

  function iniciar() {
    // Actividad en tiempo real (se actualiza sola; con avisos activados suena/vibra el celular)
    let primera = true;
    $("#activarAvisos").onclick = () => Notification.requestPermission().then(p => $("#activarAvisos").textContent = p === "granted" ? "🔔 Avisos activos" : "🔕 Avisos bloqueados");
    F.onSnapshot(F.query(F.collection(db, "movimientos"), F.orderBy("creado", "desc"), F.limit(80)), s => {
      $("#actividad").innerHTML = s.docs.map(d => { const m = d.data(); return `<div class="renglon act"><span>${esc(m.texto)}</span><span class="gris mini">${fecha(m.creado)}</span></div>`; }).join("") || '<p class="gris">Aún no hay movimientos.</p>';
      if (!primera) s.docChanges().filter(c => c.type === "added").forEach(c => {
        const t = c.doc.data().texto;
        if (window.Notification?.permission === "granted") navigator.serviceWorker?.ready.then(r => r.showNotification("Babira", { body: t, icon: "img/logo-babira.png" }));
        navigator.vibrate?.(200);
      });
      primera = false;
    });
    F.onSnapshot(F.query(F.collection(db, "clientes"), F.orderBy("alta", "desc")), s => {
      const L = s.docs.map(d => d.data()); window.__clientes = L;
      const pintar = () => { const q = $("#buscaCliente").value.toLowerCase();
        $("#clientes").innerHTML = L.filter(c => !q || [c.nombre, c.telefono, c.correo].join(" ").toLowerCase().includes(q)).map(c => {
          const tel = String(c.telefono || "").replace(/\D/g, "");
          return `<div class="renglon"><b>${esc(c.nombre || "—")}</b><span>${tel ? `<a href="https://wa.me/521${tel.slice(-10)}" target="_blank" rel="noopener">💬 ${esc(tel)}</a>` : "sin celular"}</span><span><a href="mailto:${esc(c.correo)}">${esc(c.correo)}</a></span><span class="gris mini">${fecha(c.alta)}</span></div>`; }).join("") || '<p class="gris">Sin clientes.</p>'; };
      $("#buscaCliente").oninput = pintar; pintar();
    });

    $("#kDisp").textContent = P.filter(p => p.estado === "Disponible").length;
    $("#inv").innerHTML = P.map(p => `<div class="renglon"><b>${p.id} · ${esc(p.titulo)}</b><span>${p.operacion} · ${p.ciudad}</span><span>${p.precio ? "$" + p.precio.toLocaleString("es-MX") : "—"}</span><span class="est">${p.estado}</span></div>`).join("");

    F.onSnapshot(F.query(F.collection(db, "prospectos"), F.orderBy("creado", "desc")), s => {
      const L = s.docs.map(d => ({ id: d.id, ...d.data() })); window.__prospectos = L;
      const n = e => L.filter(x => x.etapa === e).length;
      $("#kNuevos").textContent = n("Nuevo");
      $("#kActivos").textContent = n("Contactado") + n("Visita agendada") + n("Negociación");
      $("#kCerrados").textContent = n("Cerrado");
      $("#kConv").textContent = L.length ? Math.round(n("Cerrado") / L.length * 100) + "%" : "0%";
      $("#embudo").innerHTML = ETAPAS.map(e => `<div class="col"><h3>${e}<span>${n(e)}</span></h3>${L.filter(x => x.etapa === e).map(tarjeta).join("")}</div>`).join("");
    });

    F.onSnapshot(F.query(F.collection(db, "pagos"), F.orderBy("creado", "desc")), s => {
      let total = 0;
      $("#pagos").innerHTML = s.docs.map(d => { const p = d.data(); if (p.estado === "pagado") total += p.monto;
        return `<div class="renglon"><b>${esc(p.concepto)}</b><span>${esc(p.correo)}</span><span>$${p.monto.toLocaleString("es-MX")} · ${p.pasarela}</span><span class="est ${p.estado}">${p.estado}</span></div>`; }).join("") || '<p class="gris">Sin pagos.</p>';
      $("#kCobrado").textContent = "$" + total.toLocaleString("es-MX");
    });

    F.onSnapshot(F.query(F.collection(db, "citas"), F.orderBy("fecha", "desc")), s => {
      $("#citas").innerHTML = s.docs.map(d => { const c = d.data();
        return `<div class="renglon"><b>${esc(c.nombre)} · ${esc(c.telefono)}</b><span>${c.propiedad || "Asesoría"}</span><span>${new Date(c.fecha).toLocaleString("es-MX")}</span>
          <select data-cita="${d.id}">${["solicitada", "confirmada", "realizada", "cancelada"].map(x => `<option ${x === c.estado ? "selected" : ""}>${x}</option>`).join("")}</select></div>`; }).join("") || '<p class="gris">Sin citas.</p>';
    });

    F.onSnapshot(F.query(F.collection(db, "conversaciones"), F.orderBy("actualizado", "desc"), F.limit(30)), s => {
      $("#chats").innerHTML = s.docs.map(d => { const c = d.data();
        return `<details class="caja"><summary><b>${c.origen}</b> · ${fecha(c.actualizado)} · ${c.mensajes?.length || 0} mensajes</summary>
          ${(c.mensajes || []).map(m => `<p><b>${m.role === "user" ? "Cliente" : "Asesor IA"}:</b> ${esc(m.content)}</p>`).join("")}</details>`; }).join("") || '<p class="gris">Sin conversaciones.</p>';
    });

    document.addEventListener("change", e => {
      if (e.target.dataset.lead) F.updateDoc(F.doc(db, "prospectos", e.target.dataset.lead), { etapa: e.target.value, movido: F.serverTimestamp() });
      if (e.target.dataset.cita) F.updateDoc(F.doc(db, "citas", e.target.dataset.cita), { estado: e.target.value });
    });
  }

  function tarjeta(x) {
    const tel = String(x.telefono || "").replace(/\D/g, "");
    const wa = tel ? `https://wa.me/${tel.length === 10 ? "521" + tel : tel}?text=${encodeURIComponent(`Hola ${x.nombre || ""}, te escribe Betty de Babira Asesores 🏠`)}` : "";
    return `<div class="lead"><b>${esc(x.nombre || "Sin nombre")}</b>${esc(x.busca || "")} ${x.propiedad ? "· " + esc(x.propiedad) : ""}
      <div class="gris">${esc(x.zona || "")} ${x.presupuesto ? "· " + esc(x.presupuesto) : ""}</div>
      <div class="gris mini">${esc(x.origen || "web")} · ${fecha(x.creado)}</div>
      <div class="acc">${wa ? `<a href="${wa}" target="_blank" rel="noopener">💬</a>` : ""}${x.correo ? `<a href="mailto:${esc(x.correo)}">✉️</a>` : ""}
        <select data-lead="${x.id}">${ETAPAS.map(e => `<option ${e === x.etapa ? "selected" : ""}>${e}</option>`).join("")}</select></div></div>`;
  }
}


// Exportar registros a Excel (CSV con BOM para que Excel respete los acentos)
const fechaTxt = t => t?.toDate ? t.toDate().toLocaleString("es-MX") : "";
function descargarExcel(nombre, columnas, filas) {
  const celda = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\ufeff" + [columnas.map(c => celda(c[0])).join(","), ...filas.map(f => columnas.map(c => celda(c[1](f))).join(","))].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${nombre}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}
document.addEventListener("click", e => {
  if (e.target.id === "xlsClientes") descargarExcel("clientes_babira", [
    ["Nombre(s)", c => c.nombres || c.nombre], ["Apellidos", c => c.apellidos], ["Celular", c => c.telefono], ["Correo", c => c.correo],
    ["Interés", c => c.interes], ["Ciudad", c => c.ciudad], ["Contacto preferido", c => c.contacto], ["Alta", c => fechaTxt(c.alta)], ["Último acceso", c => fechaTxt(c.ultimoAcceso)],
  ], window.__clientes || []);
  if (e.target.id === "xlsProspectos") descargarExcel("prospectos_babira", [
    ["Nombre", p => p.nombre], ["Teléfono", p => p.telefono], ["Correo", p => p.correo], ["Busca", p => p.busca], ["Zona", p => p.zona],
    ["Presupuesto", p => p.presupuesto], ["Propiedad", p => p.propiedad], ["Mensaje", p => p.mensaje], ["Origen", p => p.origen], ["Etapa", p => p.etapa], ["Fecha", p => fechaTxt(p.creado)],
  ], window.__prospectos || []);
});
