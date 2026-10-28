// Configuración central del sitio. Lo único que hay que llenar al crear el proyecto de Firebase.
// Firebase Console → Configuración del proyecto → Tus apps → Web → firebaseConfig
export const FIREBASE = {
  apiKey: "AIzaSyCy9O_tnuvQr91Y9_RwIGFATzNiQMaoglQ",
  authDomain: "babira-f6374.firebaseapp.com",
  projectId: "babira-f6374",
  storageBucket: "babira-f6374.firebasestorage.app",
  messagingSenderId: "204944472095",
  appId: "1:204944472095:web:20c74aa5954d0092fc3d2a",
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
