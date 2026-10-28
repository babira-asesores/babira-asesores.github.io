# Guía de activación: Babira Asesores

El sitio funciona **desde el día 1** como catálogo con WhatsApp y correo. Cada sistema se enciende cuando se conecta su cuenta; mientras tanto, el sitio muestra la alternativa por WhatsApp.

| Sistema | Qué hace | Requiere | Costo aprox. |
|---|---|---|---|
| Catálogo + inventario | Casas, fotos, filtros, WhatsApp y correo | GitHub | Gratis |
| Cuentas de cliente | Registro con Google o correo, mis pagos, mis citas | Firebase Auth | Gratis |
| Embudo / CRM | Prospectos del formulario, chat, bots y pagos en un tablero por etapas | Firestore | Gratis hasta ~50 mil lecturas/día |
| Asesor IA | Chat que recomienda casas del inventario y captura prospectos | API key de Anthropic (Claude) | ~$0.01–0.05 USD por conversación |
| Pagos | Apartado, renta mensual, reservas por noche, avalúos, asesorías | Mercado Pago y/o Stripe | Comisión por cobro (~3–4% + IVA) |
| Bot WhatsApp / Messenger / Instagram | Responde solo, con el mismo asesor IA | Meta Business verificado + WhatsApp Cloud API | Conversaciones de servicio: gratis o centavos |
| Aviso a Betty | Cada prospecto nuevo le llega por WhatsApp | WhatsApp Cloud API | Igual que arriba |

> Firebase Functions requiere el **plan Blaze** (pago por uso). Con este tráfico suele quedar en $0–5 USD/mes. Pon una alerta de presupuesto en Google Cloud.

---

## 1. Firebase (base de todo)
1. Entra a https://console.firebase.google.com → **Agregar proyecto** → `babira-asesores`.
2. **Authentication** → Comenzar → activa **Google** y **Correo/contraseña**.
3. **Firestore Database** → Crear → modo producción → región `us-central`.
4. **Configuración del proyecto → Tus apps → Web (</>)** → copia el `firebaseConfig` en `js/config.js`.
5. Cambia el plan a **Blaze** y crea una alerta de presupuesto (ej. $10 USD).
6. Administradores: Betty entra una vez a `/admin.html` con Google; el panel le muestra su **UID**. En Firestore crea la colección `admins` con un documento cuyo ID sea ese UID (los campos pueden quedar vacíos).

## 2. Claves secretas (nunca van en el código)
En una terminal con Firebase CLI (`npm i -g firebase-tools`, `firebase login`):
```
firebase functions:secrets:set ANTHROPIC_API_KEY      # console.anthropic.com → API Keys
firebase functions:secrets:set MP_ACCESS_TOKEN        # Mercado Pago → Tus integraciones → Credenciales de producción
firebase functions:secrets:set STRIPE_SECRET          # dashboard.stripe.com → Developers → API keys (sk_live_…)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # se obtiene en el paso 4
firebase functions:secrets:set META_TOKEN             # paso 5
firebase functions:secrets:set META_VERIFY_TOKEN      # inventa una palabra, ej. babira2026
```
Empieza con las claves **de prueba** (Mercado Pago y Stripe tienen modo test) y cámbialas a producción al final.

## 3. Mercado Pago
- Webhook: Tus integraciones → Webhooks → URL `https://TU-SITIO/api/mercadopago`, evento **Pagos**.

## 4. Stripe
- Activa **OXXO** en Settings → Payment methods.
- Developers → Webhooks → `https://TU-SITIO/api/stripe`, eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Copia el *signing secret* a `STRIPE_WEBHOOK_SECRET`.

## 5. Meta: WhatsApp, Messenger e Instagram
1. https://business.facebook.com → verifica el negocio "Asesores Babira".
2. https://developers.facebook.com → Crear app (tipo **Empresa**) → agrega **WhatsApp**, **Messenger** e **Instagram**.
3. WhatsApp → Configuración de la API: registra un número (puede ser uno nuevo; el 662 124 5820 debe salir de la app normal de WhatsApp Business si se migra). Copia el **Phone number ID** y define el parámetro `WA_PHONE_ID` en `functions/.env`.
4. Genera un **token permanente** (Usuario del sistema con permisos `whatsapp_business_messaging`, `pages_messaging`, `instagram_manage_messages`) → `META_TOKEN`.
5. Webhook en las tres: URL `https://TU-SITIO/api/meta`, token de verificación = `META_VERIFY_TOKEN`. Suscribe `messages` (WhatsApp) y `messages` (Messenger/IG) para la página.

## 6. GitHub (publicación automática)
1. En el repo → Settings → Secrets → Actions:
   - `FIREBASE_SERVICE_ACCOUNT`: JSON de una cuenta de servicio (Google Cloud → IAM → Cuentas de servicio → rol *Firebase Admin* → Claves → JSON).
   - Variable `FIREBASE_PROJECT_ID`: `babira-asesores`.
2. Desde ese momento cada cambio en el inventario publica sitio, funciones y reglas en Firebase. Sin el secreto, el catálogo se publica en GitHub Pages.

## 7. Dominio
Firebase Hosting → Agregar dominio personalizado → `asesoresbabira.com` (se compra en Google Domains/Squarespace, Namecheap o GoDaddy, ~$250 MXN/año).

## Montos (editar en `functions/index.js` → `MONTOS`)
- Apartado: $3,000 · Avalúo: $3,500 · Asesoría: $800
- Renta mensual: la columna `precio` del inventario
- Reserva por noche: la columna `precio_noche` (llénala en los departamentos amueblados para activarla)
