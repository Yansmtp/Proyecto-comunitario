// ============================================================
//  data.js - Lector de datos de la página pública (módulo ES)
//  Ruta: lee de Supabase (si está configurado) y, si no, usa
//  los DATOS_INICIALES de supabase-config.js como respaldo.
//  ============================================================
import { DATOS_INICIALES } from './supabase-config.js';
import { configurado, api } from './supabase.js';

// ------------------------------------------------------------
//  Utilidades
// ------------------------------------------------------------
function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ------------------------------------------------------------
//  RENDERIZADORES
// ------------------------------------------------------------
function renderTestimonios(lista) {
  const container = document.getElementById('testimoniosContainer');
  if (!container) return;
  container.innerHTML = (lista || []).map((t) => `
      <div class="historia-card">
        <h3>${escaparHTML(t.titulo)}</h3>
        <p>${escaparHTML(t.descripcion)}</p>
        <span class="nombre">— ${escaparHTML(t.autor)}</span>
      </div>
    `).join('');
}

function renderDiario(lista) {
  const container = document.getElementById('diarioContainer');
  if (!container) return;
  container.innerHTML = (lista || []).map((e) => `
      <div class="diario-card">
        <span class="fecha">${escaparHTML(e.fecha)}</span>
        <h4>${escaparHTML(e.titulo)}</h4>
        <p>${escaparHTML(e.resumen)}</p>
      </div>
    `).join('');
}

function renderEstadisticas(lista) {
  const container = document.getElementById('impactoContainer');
  if (!container) return;
  container.innerHTML = (lista || []).map((s) => `
      <div class="impacto-item">
        <div class="numero">${escaparHTML(s.numero)}</div>
        <div class="label">${escaparHTML(s.etiqueta)}</div>
      </div>
    `).join('');
}

function renderGaleria(lista) {
  const container = document.getElementById('galeriaContainer');
  if (!container) return;
  container.innerHTML = '';
  // Se usa createElement + style (API de DOM) en lugar de innerHTML
  // para que las comillas de la data-URL no rompan la sentencia CSS
  // ni el atributo HTML `style="..."`.
  (lista || []).forEach((url) => {
    const item = document.createElement('div');
    item.className = 'foto-item';
    item.style.backgroundImage = `url("${url}")`;
    container.appendChild(item);
  });
}

// ------------------------------------------------------------
//  Carga remota desde Supabase
// ------------------------------------------------------------
async function obtenerRemoto() {
  if (!configurado) return null;
  const [testimonios, entradas, estadisticas, multimedia] = await Promise.all([
    api.listar('testimonios'),
    api.listar('entradas'),
    api.listar('estadisticas'),
    api.listar('multimedia')
  ]);
  return {
    testimonios: (testimonios || []).map((r) => ({ titulo: r.titulo, descripcion: r.descripcion, autor: r.autor })),
    entradas: (entradas || []).map((r) => ({ fecha: r.fecha, titulo: r.titulo, resumen: r.resumen })),
    estadisticas: (estadisticas || []).map((r) => ({ numero: r.numero, etiqueta: r.etiqueta })),
    multimedia: (multimedia || []).map((r) => r.url)
  };
}

function renderTodo(datos) {
  renderTestimonios(datos.testimonios);
  renderDiario(datos.entradas);
  renderEstadisticas(datos.estadisticas);
  renderGaleria(datos.multimedia);
}

async function iniciar() {
  try {
    const remoto = await obtenerRemoto();
    if (remoto) {
      renderTodo(remoto);
      return;
    }
  } catch (err) {
    console.warn('[TejiendoVida] No se pudo conectar a Supabase; usando datos por defecto.', err);
  }
  const d = DATOS_INICIALES;
  renderTodo({
    testimonios: d.testimonios,
    entradas: d.entradas,
    estadisticas: d.estadisticas,
    multimedia: d.multimedia.map((m) => m.url)
  });
}

// Ejecución (el módulo se carga tras parsear el HTML)
iniciar();