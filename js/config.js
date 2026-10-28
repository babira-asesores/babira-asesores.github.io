// Configuración central del sitio. Lo único que hay que llenar al crear el proyecto de Firebase.
// Firebase Console → Configuración del proyecto → Tus apps → Web → firebaseConfig
export const FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const NEGOCIO = {
  whatsapp: "5216621245820",
  correo: "asesoresbabira@gmail.com",
  // Montos por defecto (MXN) cuando la propiedad no trae uno propio
  deposito_apartado: 3000,
  avaluo: 3500,
  asesoria: 800,
};

// Si FIREBASE.projectId está vacío el sitio funciona igual, solo con WhatsApp y correo.
export const firebaseListo = () => Boolean(FIREBASE.projectId);
