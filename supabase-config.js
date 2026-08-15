// ============================================================
//  supabase-config.js
//  CONFIGURACIÓN DE SUPABASE + DATOS INICIALES
//  ============================================================
//  CÓMO CONFIGURAR (pasos):
//   1) Crea un proyecto GRATIS en https://supabase.com
//   2) Panel > Project Settings > API.
//   3) Copia "Project URL" en SUPABASE_URL (ej. https://xxxx.supabase.co)
//      y tu "anon public" key en SUPABASE_ANON_KEY
//   4) Ejecuta el contenido de supabase.sql en: SQL Editor
//   5) Publica el sitio en Vercel y listo. El panel vive en
//      /admin.html y la página pública lee los datos de la nube.
//  Si dejas estos campos vacíos, el sitio usa los DATOS_INICIALES
//  como respaldo y el panel solo guarda en el navegador local.
// ============================================================

// Proyecto (ref): gtkpsjqcsqiokgsnylqe
// URL de la API REST de Supabase (Settings > API > Project URL)
export const SUPABASE_URL = "https://gtkpsjqcsqiokgsnylqe.supabase.co";
// La anon key (Settings > API > anon public key) se copia aquí.
export const SUPABASE_ANON_KEY = "";

// Clave de acceso del panel de administración (admin.html).
// Cámbiala por una segura antes de publicar.
export const ADMIN_PASSWORD = "tejiendo2026";

// ------------------------------------------------------------
// DATOS_INICIALES
// Se usan como respaldo en la página pública y como contenido
// de muestra en el panel antes de configurar Supabase.
// ------------------------------------------------------------
export const DATOS_INICIALES = {
  testimonios: [
    {
      titulo: "Volver a creer en mí",
      descripcion: "María encontró en el telar una forma de reconstruir su confianza y su futuro.",
      autor: "María, participante",
      activo: true,
      orden: 1
    },
    {
      titulo: "Aprendí que todavía podía crear",
      descripcion: "Ana redescubrió su capacidad de asombro y creatividad en el taller de manualidades.",
      autor: "Ana, taller de manualidades",
      activo: true,
      orden: 2
    },
    {
      titulo: "Hoy tengo algo que puedo enseñar",
      descripcion: "Laura comenzó como alumna y ahora guía a otras mujeres en el camino del aprendizaje.",
      autor: "Laura, facilitadora",
      activo: true,
      orden: 3
    }
  ],
  entradas: [
    { fecha: "15 AGO", titulo: "Nuevo taller de tejido artesanal", resumen: "Iniciamos ciclo con técnicas tradicionales y materiales naturales.", activo: true, orden: 1 },
    { fecha: "08 AGO", titulo: "Una tarde de creatividad y comunidad", resumen: "Jornada abierta donde compartimos experiencias y tejidos.", activo: true, orden: 2 },
    { fecha: "02 AGO", titulo: "Nuevas participantes se incorporan al programa", resumen: "Recibimos a un grupo de mujeres que inician su proceso de reconstrucción.", activo: true, orden: 3 }
  ],
  estadisticas: [
    { numero: "+120", etiqueta: "Mujeres acompañadas", activo: true, orden: 1 },
    { numero: "+35", etiqueta: "Talleres realizados", activo: true, orden: 2 },
    { numero: "+18", etiqueta: "Habilidades desarrolladas", activo: true, orden: 3 },
    { numero: "+240", etiqueta: "Horas de formación", activo: true, orden: 4 }
  ],
  multimedia: [
    { tipo: "galeria", url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23cbd5ea'/><circle cx='80' cy='80' r='50' fill='%23ff6f61' opacity='0.2'/><circle cx='150' cy='130' r='40' fill='%23b3c0d8' opacity='0.2'/></svg>", activo: true, orden: 1 },
    { tipo: "galeria", url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23c7d2e6'/><path d='M40 100 L100 30 L160 100' stroke='%23ff6f61' stroke-width='10' fill='none' opacity='0.25'/></svg>", activo: true, orden: 2 },
    { tipo: "galeria", url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23d4dcec'/><rect x='40' y='40' width='120' height='120' fill='%23ff6f61' opacity='0.15' rx='20'/></svg>", activo: true, orden: 3 },
    { tipo: "galeria", url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23cbd5ea'/><circle cx='100' cy='100' r='70' fill='%23ff6f61' opacity='0.1'/></svg>", activo: true, orden: 4 }
  ]
};