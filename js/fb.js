// Conexión a Firebase (login, base de datos y funciones). Se carga solo si está configurado.
import { FIREBASE, firebaseListo } from "./config.js?v=20261028b";

const V = "12.1.0";
let cache;

export async function fb() {
  if (!firebaseListo()) return null;
  if (cache) return cache;
  const [{ initializeApp }, auth, fs, fn] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-functions.js`),
  ]);
  const app = initializeApp(FIREBASE);
  cache = {
    auth: auth.getAuth(app), A: auth,
    db: fs.getFirestore(app), F: fs,
    llamar: (nombre, datos) => fn.httpsCallable(fn.getFunctions(app, "us-central1"), nombre)(datos).then(r => r.data),
  };
  return cache;
}

// Modelo de Gemini (Firebase AI Logic, Gemini Developer API): tiene capa gratuita y funciona en el plan Spark.
export async function gemini(systemInstruction) {
  if (!firebaseListo()) return null;
  const [{ initializeApp, getApps }, ai] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-ai.js`),
  ]);
  const app = getApps()[0] || initializeApp(FIREBASE);
  return ai.getGenerativeModel(ai.getAI(app, { backend: new ai.GoogleAIBackend() }), {
    model: "gemini-3.8-flash",
    systemInstruction,
    generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
  });
}

// Guarda un prospecto en el embudo (lo pueden crear visitantes sin cuenta).
export async function guardarProspecto(datos) {
  const f = await fb();
  if (!f) return false;
  await f.F.addDoc(f.F.collection(f.db, "prospectos"), {
    ...datos, etapa: "Nuevo", creado: f.F.serverTimestamp(), uid: f.auth.currentUser?.uid || null,
  });
  return true;
}
