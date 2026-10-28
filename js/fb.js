// Conexión a Firebase (login, base de datos y funciones). Se carga solo si está configurado.
import { FIREBASE, firebaseListo } from "./config.js";

const V = "10.12.2";
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

// Guarda un prospecto en el embudo (lo pueden crear visitantes sin cuenta).
export async function guardarProspecto(datos) {
  const f = await fb();
  if (!f) return false;
  await f.F.addDoc(f.F.collection(f.db, "prospectos"), {
    ...datos, etapa: "Nuevo", creado: f.F.serverTimestamp(), uid: f.auth.currentUser?.uid || null,
  });
  return true;
}
