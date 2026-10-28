import { fb } from "./fb.js";

const $ = s => document.querySelector(s);
const P = window.PROPIEDADES || [];
const aviso = (t, tipo = "ok") => { const a = $("#aviso"); a.textContent = t; a.className = "aviso " + tipo; a.hidden = !t; };
const fecha = t => t?.toDate ? t.toDate().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
const params = new URLSearchParams(location.search);

const f = await fb();
if (!f) {
  $("#vSinConfig").hidden = false;
} else {
  const { auth, A, db, F } = f;

  if (params.get("estado") === "ok") aviso("¡Pago recibido! En cuanto se confirme aparecerá como pagado.");
  if (params.get("estado") === "cancelado" || params.get("estado") === "error") aviso("El pago no se completó. Puedes intentarlo de nuevo.", "error");

  // Opciones de propiedades según el tipo de pago
  const llenarProps = () => {
    const t = $("#pTipo").value;
    const lista = P.filter(p => t === "apartado" ? p.operacion === "Renta" && p.estado === "Disponible"
      : t === "renta" ? p.operacion === "Renta" && p.precio
      : t === "reserva" ? p.precio_dia : t === "anual" ? p.precio_anual : false);
    $("#pProp").hidden = ["avaluo", "asesoria"].includes(t);
    $("#pProp").innerHTML = lista.map(p => `<option value="${p.id}">${p.id} · ${p.titulo}${p.precio ? " · $" + p.precio.toLocaleString("es-MX") : ""}</option>`).join("")
      || '<option value="">No hay propiedades para esta opción</option>';
    $("#pNoches").hidden = t !== "reserva";
  };
  $("#pTipo").addEventListener("change", llenarProps);
  $("#cProp").innerHTML = '<option value="">Asesoría general (sin propiedad)</option>' +
    P.filter(p => p.estado === "Disponible").map(p => `<option value="${p.id}">${p.id} · ${p.titulo}</option>`).join("");
  const apartar = params.get("apartar");
  if (apartar) { $("#pTipo").value = "apartado"; }
  llenarProps();
  if (apartar) $("#pProp").value = apartar;

  // Acceso
  $("#google").onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(e => aviso(e.message, "error"));
  let modo = "entrar";
  document.querySelectorAll("#fAcceso button").forEach(b => b.onclick = () => (modo = b.dataset.modo));
  $("#fAcceso").onsubmit = async e => {
    e.preventDefault();
    try {
      if (modo === "registro") {
        sessionStorage.babiraTel = $("#aTel").value;
        const c = await A.createUserWithEmailAndPassword(auth, $("#aCorreo").value, $("#aPass").value);
        if ($("#aNombre").value) await A.updateProfile(c.user, { displayName: $("#aNombre").value });
      } else await A.signInWithEmailAndPassword(auth, $("#aCorreo").value, $("#aPass").value);
    } catch (err) { aviso("No se pudo: " + err.code.replace("auth/", ""), "error"); }
  };
  $("#olvide").onclick = () => $("#aCorreo").value
    ? A.sendPasswordResetEmail(auth, $("#aCorreo").value).then(() => aviso("Te enviamos un correo para restablecerla."))
    : aviso("Escribe tu correo primero.", "error");
  $("#salir").onclick = () => A.signOut(auth);

  // Sesión
  A.onAuthStateChanged(auth, async u => {
    $("#vAcceso").hidden = !!u; $("#vCuenta").hidden = true; $("#vPerfil").hidden = true;
    if (!u) return;
    // La contraseña la guarda Firebase Authentication cifrada (nadie la puede ver, ni Betty).
    // Nombre, celular y correo se guardan en Firestore → clientes/{uid}, visibles en el panel.
    const ref = F.doc(db, "clientes", u.uid);
    const previo = (await F.getDoc(ref)).data() || {};
    const tel = previo.telefono || sessionStorage.babiraTel || "";
    await F.setDoc(ref, {
      nombre: previo.nombre || u.displayName || "", correo: u.email, telefono: tel,
      proveedor: u.providerData[0]?.providerId || "password", ultimoAcceso: F.serverTimestamp(),
      ...(previo.alta ? {} : { alta: F.serverTimestamp() }),
    }, { merge: true });
    if (!tel || !(previo.nombre || u.displayName)) {
      $("#vPerfil").hidden = false;
      $("#perNombre").value = previo.nombre || u.displayName || "";
      $("#fPerfil").onsubmit = async e => {
        e.preventDefault();
        await F.setDoc(ref, { nombre: $("#perNombre").value, telefono: $("#perTel").value.replace(/\D/g, ""), aceptoPrivacidad: F.serverTimestamp() }, { merge: true });
        location.reload();
      };
      return;
    }
    $("#vCuenta").hidden = false;
    $("#nombre").textContent = previo.nombre || u.displayName || u.email;
    $("#cTel").value = tel;
    F.onSnapshot(F.query(F.collection(db, "pagos"), F.where("uid", "==", u.uid), F.orderBy("creado", "desc")), s => {
      $("#pagos").innerHTML = s.empty ? '<p class="gris">Aún no tienes pagos.</p>' :
        s.docs.map(d => { const p = d.data(); return `<div class="renglon"><b>${p.concepto}</b><span>$${p.monto.toLocaleString("es-MX")} MXN</span><span class="est ${p.estado}">${p.estado}</span><span class="gris">${fecha(p.creado)}</span></div>`; }).join("");
    });
    F.onSnapshot(F.query(F.collection(db, "citas"), F.where("uid", "==", u.uid), F.orderBy("fecha", "desc")), s => {
      $("#citas").innerHTML = s.empty ? '<p class="gris">Sin citas.</p>' :
        s.docs.map(d => { const c = d.data(); return `<div class="renglon"><b>${c.propiedad || "Asesoría"}</b><span>${new Date(c.fecha).toLocaleString("es-MX")}</span><span class="est ${c.estado}">${c.estado}</span></div>`; }).join("");
    });
  });

  // Pago
  $("#fPago").onsubmit = async e => {
    e.preventDefault();
    const btn = e.submitter; btn.disabled = true; btn.textContent = "Preparando pago…";
    try {
      const r = await f.llamar("crearPago", {
        tipo: $("#pTipo").value, propiedadId: $("#pProp").value || null, noches: $("#pNoches").value,
        pasarela: document.querySelector("[name=pas]:checked").value,
      });
      location.href = r.url;
    } catch (err) { aviso(err.message, "error"); btn.disabled = false; btn.textContent = "Continuar al pago seguro"; }
  };

  // Cita (también entra al embudo como prospecto)
  $("#fCita").onsubmit = async e => {
    e.preventDefault();
    const u = auth.currentUser;
    await F.addDoc(F.collection(db, "citas"), {
      uid: u.uid, nombre: u.displayName || u.email, correo: u.email, telefono: $("#cTel").value,
      propiedad: $("#cProp").value || null, fecha: $("#cFecha").value, nota: $("#cNota").value,
      estado: "solicitada", creado: F.serverTimestamp(),
    });
    await F.addDoc(F.collection(db, "prospectos"), {
      nombre: u.displayName || u.email, correo: u.email, telefono: $("#cTel").value, busca: "Cita solicitada",
      propiedad: $("#cProp").value || null, mensaje: $("#cNota").value, origen: "cuenta", etapa: "Nuevo",
      creado: F.serverTimestamp(), uid: u.uid,
    });
    e.target.reset(); aviso("Cita solicitada. Te confirmamos por WhatsApp.");
  };
}
