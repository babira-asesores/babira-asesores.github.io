// Backend de Babira Asesores (Firebase Cloud Functions)
// - asesor: chat con IA que recomienda propiedades y captura prospectos
// - crearPago: genera el cobro en Mercado Pago o Stripe (apartado, renta, reserva, avalúo, asesoría)
// - webhookMercadoPago / webhookStripe: confirman pagos y actualizan el inventario
// - metaWebhook: bot de WhatsApp, Messenger e Instagram con el mismo asesor IA
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import Stripe from "stripe";
import { readFileSync } from "node:fs";

initializeApp();
const db = getFirestore();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const META_TOKEN = defineSecret("META_TOKEN");            // token de la app de Meta (WhatsApp/Messenger/IG)
const META_VERIFY = defineSecret("META_VERIFY_TOKEN");    // palabra secreta para verificar el webhook
const WA_PHONE_ID = defineString("WA_PHONE_ID", { default: "" });
const SITIO = defineString("SITIO_URL", { default: "https://babira-asesores.web.app" });

const MONTOS = { deposito_apartado: 3000, avaluo: 3500, asesoria: 800 };
const propiedades = () => JSON.parse(readFileSync(new URL("./propiedades.json", import.meta.url), "utf8"));

// ---------- Asesor IA ----------
function sistema() {
  const inv = propiedades()
    .filter(p => p.estado === "Disponible" || p.estado === "Apartada")
    .map(p => `- ${p.id} | ${p.operacion} | ${p.tipo} | ${p.titulo} | ${p.colonia || ""}, ${p.ciudad} (${p.zona || "s/zona"}) | ` +
      `${p.precio ? "$" + p.precio.toLocaleString("es-MX") : "precio a consultar"} | ${p.recamaras || "-"} rec, ${p.banos || "-"} baños | ` +
      `${p.caracteristicas.join(", ")} | ${p.condiciones || ""} | estado: ${p.estado}`).join("\n");
  return `Eres el asesor virtual de Babira Asesores Bienes Raíces (Hermosillo y Nogales, Sonora). Más de 16 años de experiencia; servicios: rentas, compra-venta, avalúos, asesoría legal, trámite de créditos Infonavit y bancarios, y administración de propiedades.

Tu trabajo:
1. Entender qué busca la persona (renta o compra, zona, presupuesto, recámaras, mascotas, fecha de mudanza).
2. Recomendar SOLO propiedades del inventario de abajo, citando su clave (ej. BB-006). Si ninguna encaja, dilo y ofrece que Betty le busque opciones.
3. Pedir nombre y teléfono para agendar una visita. Cuando los tengas, responde también con la línea exacta:
PROSPECTO: {"nombre":"...","telefono":"...","busca":"...","zona":"...","presupuesto":"...","propiedad":"BB-xxx"}
4. Para apartar, pagar renta o reservar, indica que puede hacerlo en la sección "Mi cuenta" del sitio.

Reglas: responde en español de México, cálido y breve (máximo 5 líneas). No inventes precios, propiedades ni datos legales. Para dudas legales o de crédito específicas, ofrece una asesoría con Betty (WhatsApp 662 124 5820, asesoresbabira@gmail.com).

INVENTARIO ACTUAL:
${inv}`;
}

async function responderIA(historial, origen, conversacionId) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
  const r = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: sistema(),
    messages: historial.slice(-20),
  });
  if (r.stop_reason === "refusal") return "Disculpa, no puedo ayudarte con eso. ¿Te comunico con Betty por WhatsApp al 662 124 5820?";
  let texto = r.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  const m = texto.match(/PROSPECTO:\s*(\{.*\})/);
  if (m) {
    texto = texto.replace(m[0], "").trim();
    try {
      const d = JSON.parse(m[1]);
      await db.collection("prospectos").add({ ...d, origen, etapa: "Nuevo", creado: FieldValue.serverTimestamp(), conversacion: conversacionId });
    } catch { /* línea mal formada: se ignora */ }
  }
  await db.collection("conversaciones").doc(conversacionId).set({
    origen, actualizado: FieldValue.serverTimestamp(),
    mensajes: [...historial, { role: "assistant", content: texto }],
  }, { merge: true });
  return texto;
}

export const asesor = onRequest({ secrets: [ANTHROPIC_API_KEY], cors: true }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { mensajes, sesion } = req.body || {};
  if (!Array.isArray(mensajes) || !mensajes.length || typeof sesion !== "string")
    return res.status(400).json({ error: "solicitud inválida" });
  const limpios = mensajes.slice(-20).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) }));
  try {
    res.json({ respuesta: await responderIA(limpios, "web", "web_" + sesion.slice(0, 40)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ respuesta: "Ahorita no puedo responder. Escríbenos por WhatsApp al 662 124 5820." });
  }
});

// ---------- Pagos ----------
function calcularCobro({ tipo, propiedadId, noches }) {
  const p = propiedadId ? propiedades().find(x => x.id === propiedadId) : null;
  switch (tipo) {
    case "apartado":
      if (!p || p.operacion !== "Renta" || p.estado !== "Disponible") throw new HttpsError("failed-precondition", "La propiedad no está disponible para apartar.");
      return { monto: MONTOS.deposito_apartado, concepto: `Apartado ${p.id} – ${p.titulo}`, p };
    case "renta":
      if (!p?.precio) throw new HttpsError("failed-precondition", "Esta propiedad no tiene renta mensual registrada.");
      return { monto: p.precio, concepto: `Renta mensual ${p.id} – ${p.titulo}`, p };
    case "reserva": {
      const n = Math.max(1, Math.min(60, parseInt(noches) || 0));
      if (!p?.precio_dia) throw new HttpsError("failed-precondition", "Esta propiedad no se renta por día.");
      return { monto: p.precio_dia * n, concepto: `Reserva ${n} día(s) ${p.id} – ${p.titulo}`, p };
    }
    case "anual":
      if (!p?.precio_anual) throw new HttpsError("failed-precondition", "Esta propiedad no tiene renta anual registrada.");
      return { monto: p.precio_anual, concepto: `Renta anual ${p.id} – ${p.titulo}`, p };
    case "avaluo": return { monto: MONTOS.avaluo, concepto: "Avalúo profesional" };
    case "asesoria": return { monto: MONTOS.asesoria, concepto: "Asesoría inmobiliaria / legal" };
    default: throw new HttpsError("invalid-argument", "Tipo de pago desconocido.");
  }
}

export const crearPago = onCall({ secrets: [MP_ACCESS_TOKEN, STRIPE_SECRET] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Inicia sesión para pagar.");
  const { pasarela = "mercadopago" } = req.data;
  const { monto, concepto, p } = calcularCobro(req.data);
  const ref = db.collection("pagos").doc();
  await ref.set({
    uid: req.auth.uid, correo: req.auth.token.email || null, tipo: req.data.tipo, propiedad: p?.id || null,
    concepto, monto, moneda: "MXN", pasarela, estado: "pendiente", creado: FieldValue.serverTimestamp(),
  });
  const volver = `${SITIO.value()}/cuenta.html?pago=${ref.id}`;

  if (pasarela === "stripe") {
    const stripe = new Stripe(STRIPE_SECRET.value());
    const s = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "oxxo"],
      line_items: [{ quantity: 1, price_data: { currency: "mxn", unit_amount: Math.round(monto * 100), product_data: { name: concepto } } }],
      customer_email: req.auth.token.email,
      success_url: volver + "&estado=ok", cancel_url: volver + "&estado=cancelado",
      metadata: { pagoId: ref.id },
    });
    await ref.update({ externo: s.id });
    return { url: s.url };
  }
  const mp = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN.value() });
  const pref = await new Preference(mp).create({ body: {
    items: [{ id: ref.id, title: concepto, quantity: 1, unit_price: monto, currency_id: "MXN" }],
    payer: { email: req.auth.token.email },
    external_reference: ref.id,
    back_urls: { success: volver + "&estado=ok", failure: volver + "&estado=error", pending: volver + "&estado=pendiente" },
    auto_return: "approved",
    notification_url: `${SITIO.value()}/api/mercadopago`,
  } });
  await ref.update({ externo: pref.id });
  return { url: pref.init_point };
});

async function confirmarPago(pagoId, estado, detalle) {
  const ref = db.collection("pagos").doc(pagoId);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({ estado, detalle, actualizado: FieldValue.serverTimestamp() });
  const pago = snap.data();
  if (estado === "pagado" && pago.tipo === "apartado" && pago.propiedad) {
    // Queda registrado para que Betty cambie la propiedad a "Apartada" en el inventario
    await db.collection("prospectos").add({
      nombre: pago.correo, correo: pago.correo, busca: "Apartado pagado", propiedad: pago.propiedad,
      origen: "pago", etapa: "Negociación", creado: FieldValue.serverTimestamp(),
    });
  }
}

export const webhookMercadoPago = onRequest({ secrets: [MP_ACCESS_TOKEN] }, async (req, res) => {
  const id = req.body?.data?.id || req.query["data.id"];
  if ((req.body?.type || req.query.type) !== "payment" || !id) return res.sendStatus(200);
  // Se consulta el pago directamente a Mercado Pago: no se confía en el cuerpo del aviso
  const pago = await new Payment(new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN.value() })).get({ id });
  const mapa = { approved: "pagado", pending: "pendiente", in_process: "pendiente", rejected: "rechazado", refunded: "reembolsado", cancelled: "cancelado" };
  if (pago.external_reference) await confirmarPago(pago.external_reference, mapa[pago.status] || pago.status, { mp: pago.id, metodo: pago.payment_method_id });
  res.sendStatus(200);
});

export const webhookStripe = onRequest({ secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  let ev;
  try {
    ev = new Stripe(STRIPE_SECRET.value()).webhooks.constructEvent(req.rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value());
  } catch (e) { return res.status(400).send("firma inválida"); }
  const s = ev.data.object;
  const pagoId = s.metadata?.pagoId;
  if (pagoId) {
    if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded")
      await confirmarPago(pagoId, s.payment_status === "paid" ? "pagado" : "pendiente", { stripe: s.id });
    if (ev.type === "checkout.session.async_payment_failed" || ev.type === "checkout.session.expired")
      await confirmarPago(pagoId, "cancelado", { stripe: s.id });
  }
  res.sendStatus(200);
});

// ---------- Bots de WhatsApp, Messenger e Instagram (Meta) ----------
async function enviarMeta(canal, destino, texto) {
  const url = canal === "whatsapp"
    ? `https://graph.facebook.com/v21.0/${WA_PHONE_ID.value()}/messages`
    : `https://graph.facebook.com/v21.0/me/messages`;
  const body = canal === "whatsapp"
    ? { messaging_product: "whatsapp", to: destino, type: "text", text: { body: texto } }
    : { recipient: { id: destino }, messaging_type: "RESPONSE", message: { text: texto } };
  await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${META_TOKEN.value()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function atenderMensaje(canal, remitente, texto) {
  const convId = `${canal}_${remitente}`;
  const prev = (await db.collection("conversaciones").doc(convId).get()).data()?.mensajes || [];
  const respuesta = await responderIA([...prev, { role: "user", content: texto.slice(0, 2000) }], canal, convId);
  await enviarMeta(canal, remitente, respuesta);
}

export const metaWebhook = onRequest({ secrets: [META_TOKEN, META_VERIFY, ANTHROPIC_API_KEY] }, async (req, res) => {
  if (req.method === "GET") {
    return req.query["hub.verify_token"] === META_VERIFY.value() ? res.send(req.query["hub.challenge"]) : res.sendStatus(403);
  }
  res.sendStatus(200); // Meta exige respuesta rápida; el trabajo sigue abajo
  const b = req.body || {};
  try {
    for (const entry of b.entry || []) {
      if (b.object === "whatsapp_business_account") {
        for (const c of entry.changes || []) for (const m of c.value?.messages || [])
          if (m.type === "text") await atenderMensaje("whatsapp", m.from, m.text.body);
      } else if (b.object === "page" || b.object === "instagram") {
        for (const ev of entry.messaging || [])
          if (ev.message?.text && !ev.message.is_echo) await atenderMensaje(b.object === "page" ? "messenger" : "instagram", ev.sender.id, ev.message.text);
      }
    }
  } catch (e) { console.error("metaWebhook", e); }
});

// ---------- Bitácora: cada movimiento del negocio queda registrado y aparece al instante en la app ----------
const DESCRIBIR = {
  clientes: (a, d) => !a ? `👤 Nuevo cliente registrado: ${d.nombre || d.correo} ${d.telefono || ""}` : null,
  prospectos: (a, d) => !a ? `🎯 Prospecto nuevo (${d.origen || "web"}): ${d.nombre || "sin nombre"} · ${d.busca || ""}`
    : a.etapa !== d.etapa ? `➡️ ${d.nombre || "Prospecto"} pasó de ${a.etapa} a ${d.etapa}` : null,
  pagos: (a, d) => !a ? `💳 Pago iniciado: ${d.concepto} · $${d.monto}`
    : a.estado !== d.estado ? `💰 Pago ${d.estado}: ${d.concepto} · $${d.monto}` : null,
  citas: (a, d) => !a ? `📅 Cita solicitada: ${d.nombre} · ${d.propiedad || "asesoría"} · ${d.fecha}`
    : a.estado !== d.estado ? `📅 Cita ${d.estado}: ${d.nombre}` : null,
};
export const bitacora = onDocumentWritten("{col}/{id}", async (ev) => {
  const col = ev.params.col;
  if (!DESCRIBIR[col] || !ev.data.after.exists) return;
  const texto = DESCRIBIR[col](ev.data.before.exists ? ev.data.before.data() : null, ev.data.after.data());
  if (texto) await db.collection("movimientos").add({ texto, tipo: col, ref: `${col}/${ev.params.id}`, creado: FieldValue.serverTimestamp() });
});

// ---------- Aviso a Betty de cada prospecto nuevo ----------
export const avisoProspecto = onDocumentCreated({ document: "prospectos/{id}", secrets: [META_TOKEN] }, async (ev) => {
  const p = ev.data.data();
  const aviso = `🏠 Nuevo prospecto (${p.origen || "web"}): ${p.nombre || "sin nombre"} ${p.telefono || p.correo || ""}\n` +
    `Busca: ${p.busca || "-"} | Zona: ${p.zona || "-"} | Presupuesto: ${p.presupuesto || "-"} | Propiedad: ${p.propiedad || "-"}`;
  await db.collection("notificaciones").add({ texto: aviso, creado: FieldValue.serverTimestamp(), leido: false });
  // Con WhatsApp Business API activo, el aviso también llega al celular de Betty
  if (WA_PHONE_ID.value()) await enviarMeta("whatsapp", "5216621245820", aviso).catch(() => {});
});
