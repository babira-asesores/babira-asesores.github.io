import { fb } from "./fb.js?v=20261031d";

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
        sessionStorage.babiraNom = $("#aNombre").value.trim(); sessionStorage.babiraApe = $("#aApellidos").value.trim();
        const c = await A.createUserWithEmailAndPassword(auth, $("#aCorreo").value, $("#aPass").value);
        if ($("#aNombre").value) await A.updateProfile(c.user, { displayName: `${$("#aNombre").value} ${$("#aApellidos").value}`.trim() });
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
      nombre: previo.nombre || u.displayName || "", nombres: previo.nombres || sessionStorage.babiraNom || "", apellidos: previo.apellidos || sessionStorage.babiraApe || "", correo: u.email, telefono: tel,
      proveedor: u.providerData[0]?.providerId || "password", ultimoAcceso: F.serverTimestamp(),
      ...(previo.alta ? {} : { alta: F.serverTimestamp() }),
    }, { merge: true });
    if (!tel || !(previo.apellidos || sessionStorage.babiraApe)) {
      $("#vPerfil").hidden = false;
      $("#perNombre").value = previo.nombre || u.displayName || "";
      $("#fPerfil").onsubmit = async e => {
        e.preventDefault();
        await F.setDoc(ref, { nombre: `${$("#perNombre").value} ${$("#perApellidos").value}`.trim(), nombres: $("#perNombre").value, apellidos: $("#perApellidos").value, telefono: $("#perTel").value.replace(/\D/g, ""), aceptoPrivacidad: F.serverTimestamp() }, { merge: true });
        location.reload();
      };
      return;
    }
    $("#vCuenta").hidden = false;
    $("#nombre").textContent = previo.nombre || u.displayName || u.email;
    $("#cTel").value = tel;
    // Perfil: avatar virtual a elegir y datos de contacto
    const AV = ["babira", "casa", "llave", "edificio", "persona"];
    const pintarAvatar = a => { $("#miAvatar").src = `img/avatares/${a}.svg`; document.querySelectorAll("#avatares button").forEach(b => b.classList.toggle("on", b.dataset.a === a)); };
    $("#avatares").innerHTML = AV.map(a => `<button type="button" data-a="${a}" title="${a}"><img src="img/avatares/${a}.svg" alt="${a}"></button>`).join("");
    pintarAvatar(previo.avatar || "babira");
    $("#avatares").onclick = async e => { const b = e.target.closest("button"); if (!b) return; pintarAvatar(b.dataset.a); await F.setDoc(ref, { avatar: b.dataset.a }, { merge: true }); };
    $("#miCorreo").textContent = u.email;
    $("#mpNombre").value = previo.nombre || u.displayName || ""; $("#mpTel").value = tel;
    $("#mpTipo").value = previo.interes || ""; $("#mpCiudad").value = previo.ciudad || ""; $("#mpContacto").value = previo.contacto || "";
    $("#rTipo").textContent = previo.interes ? previo.interes.replace(/^(Busco|Soy) /, "") : "—";
    $("#fMiPerfil").onsubmit = async e => {
      e.preventDefault();
      await F.setDoc(ref, { nombre: $("#mpNombre").value, telefono: $("#mpTel").value.replace(/\D/g, ""), interes: $("#mpTipo").value,
        ciudad: $("#mpCiudad").value, contacto: $("#mpContacto").value }, { merge: true });
      $("#nombre").textContent = $("#mpNombre").value; $("#rTipo").textContent = $("#mpTipo").value.replace(/^(Busco|Soy) /, "") || "—";
      aviso("Sus datos se guardaron correctamente.");
    };
    F.onSnapshot(F.query(F.collection(db, "pagos"), F.where("uid", "==", u.uid), F.orderBy("creado", "desc")), s => {
      $("#rPagos").textContent = s.size;
      $("#pagos").innerHTML = s.empty ? '<p class="gris">Aún no tienes pagos.</p>' :
        s.docs.map(d => { const p = d.data(); return `<div class="renglon"><b>${p.concepto}</b><span>$${p.monto.toLocaleString("es-MX")} MXN</span><span class="est ${p.estado}">${p.estado}</span><span class="gris">${fecha(p.creado)}</span></div>`; }).join("");
    });
    F.onSnapshot(F.query(F.collection(db, "citas"), F.where("uid", "==", u.uid), F.orderBy("fecha", "desc")), s => {
      $("#rCitas").textContent = s.size;
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
    } catch (err) {
      // Mientras el cobro en línea no esté activo, el pago se coordina con un asesor por WhatsApp con todos los datos
      const tipoTxt = $("#pTipo").selectedOptions[0].textContent;
      const prop = $("#pProp").hidden ? "" : $("#pProp").selectedOptions[0]?.textContent || "";
      const u = auth.currentUser;
      const msg = `Buen día, deseo realizar un pago desde mi cuenta de la página.\n\n• Concepto: ${tipoTxt}${prop ? `\n• Propiedad: ${prop}` : ""}${$("#pNoches").hidden ? "" : `\n• Días: ${$("#pNoches").value}`}\n• Forma de pago preferida: ${document.querySelector("[name=pas]:checked").parentElement.textContent.trim()}\n• Nombre: ${u.displayName || ""}\n• Correo: ${u.email}\n\n¿Me comparten los datos para pagar?`;
      await F.addDoc(F.collection(db, "prospectos"), { nombre: u.displayName || u.email, correo: u.email, busca: "Pago: " + tipoTxt, propiedad: prop.split(" · ")[0] || null, origen: "pago-whatsapp", etapa: "Nuevo", creado: F.serverTimestamp(), uid: u.uid }).catch(() => {});
      aviso("Le llevamos a WhatsApp para coordinar su pago de forma segura con un asesor.");
      window.open(`https://wa.me/5216621245820?text=${encodeURIComponent(msg)}`, "_blank");
      btn.disabled = false; btn.textContent = "Continuar al pago seguro";
    }
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


// Pestañas en Mi cuenta: cada sección se ve por separado, sin scroll largo
(() => {
  const vista = document.getElementById("vCuenta"); if (!vista) return;
  const cajas = [...vista.querySelectorAll(".caja")];
  if (!cajas.length) return;
  const barra = document.createElement("div"); barra.className = "tabs-cuenta";
  cajas.forEach((c, i) => {
    const b = document.createElement("button"); b.type = "button";
    b.textContent = c.querySelector("h2")?.textContent || `Sección ${i + 1}`;
    b.onclick = () => { cajas.forEach(x => x.hidden = x !== c); barra.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
    barra.append(b);
  });
  (vista.querySelector(".resumen") || vista.firstElementChild).after(barra);
  barra.firstChild.click();
})();
