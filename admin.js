// ============================================================
//  admin.js - Lógica del panel de administración
//  ============================================================
import { DATOS_INICIALES, ADMIN_PASSWORD } from './supabase-config.js';
import { configurado, api } from './supabase.js';

// ---------------- Configuración de secciones ----------------
const SECCIONES = [
  {
    clave: 'testimonios', nombre: 'Testimonios', tabla: 'testimonios',
    campos: [
      { k: 'titulo', l: 'Título', t: 'text' },
      { k: 'descripcion', l: 'Descripción', t: 'textarea' },
      { k: 'autor', l: 'Autor', t: 'text' }
    ]
  },
  {
    clave: 'entradas', nombre: 'Entradas del diario', tabla: 'entradas',
    campos: [
      { k: 'fecha', l: 'Fecha (ej. 15 AGO)', t: 'text' },
      { k: 'titulo', l: 'Título', t: 'text' },
      { k: 'resumen', l: 'Resumen', t: 'textarea' }
    ]
  },
  {
    clave: 'estadisticas', nombre: 'Estadísticas', tabla: 'estadisticas',
    campos: [
      { k: 'numero', l: 'Número (ej. +120)', t: 'text' },
      { k: 'etiqueta', l: 'Etiqueta', t: 'text' }
    ]
  },
  {
    clave: 'multimedia', nombre: 'Galería', tabla: 'multimedia',
    campos: [
      { k: 'tipo', l: 'Tipo', t: 'select', opciones: ['galeria', 'taller'] },
      { k: 'url', l: 'URL de la imagen o data-URI', t: 'textarea' }
    ]
  }
];

// ----------------------- Estado global -----------------------
const KEY_LOCAL = 'tejiendo_local_';
let seccionActual = null;      // configuración de la sección actual
let filas = {};                // filas de la sección actual
let editandoId = null;         // id que estamos editando (null = nueva)

// ---------------- Referencias al DOM ---------------------------
const $ = (id) => document.getElementById(id);
const loginView = $('loginView');
const panelView = $('panelView');
const adminTabs = $('adminTabs');
const tituloSeccion = $('tituloSeccion');
const listaContainer = $('listaContainer');
const camposForm = $('camposForm');
const formulario = $('formulario');
const tituloFormulario = $('tituloFormulario');
const mensaje = $('mensaje');
const estadoConexion = $('estadoConexion');

// ----------------------------- Utilidades -------------------------
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = 'mensaje ' + (tipo || 'ok');
  clearTimeout(mostrarMensaje._t);
  mostrarMensaje._t = setTimeout(() => mensaje.classList.add('hidden'), 3500);
}
function guardarLocal(tabla, filasArr) {
  localStorage.setItem(KEY_LOCAL + tabla, JSON.stringify(filasArr));
}
function leerLocal(tabla, semilla) {
  const guardado = localStorage.getItem(KEY_LOCAL + tabla);
  if (guardado) {
    try { return JSON.parse(guardado); } catch { /* ignorar */ }
  }
  return semilla.map((f, i) => ({ ...f, id: 'local-' + (i + 1) }));
}

// ----------------------------- LOADER ------------------------------
async function cargarTabla(seccion) {
  seccionActual = seccion;
  editandoId = null;
  formulario.classList.add('hidden');
  try {
    if (configurado) {
      filas = await api.listar(seccion.tabla, { incluirInactivos: true });
    } else {
      filas = leerLocal(seccion.tabla, DATOS_INICIALES[seccion.clave] || []);
    }
    renderLista();
  } catch (err) {
    filas = [];
    renderLista();
    mostrarMensaje('Error al cargar: ' + err.message, 'error');
  }
}

// ----------------------------- LISTA --------------------------------
function renderLista() {
  if (!seccionActual) return;
  tituloSeccion.textContent = seccionActual.nombre;
  if (!filas.length) {
    listaContainer.innerHTML = '<div class="vacio">Aún no hay elementos. Pulsa «Añadir nuevo».</div>';
    return;
  }
  const filasHtml = filas.map((fila) => {
    const titulo = String(fila[seccionActual.campos[0].k] ?? '');
    const sub = seccionActual.campos[1] ? String(fila[seccionActual.campos[1].k] ?? '') : '';
    const activo = fila.activo !== false;
    const esImg = seccionActual.clave === 'multimedia' &&
      (/^data:/.test(fila.url) || /^https?:\/\//.test(fila.url));
    const thumb = esImg ? `<div class="item-thumb" style="background-image:url('${fila.url.replace(/'/g, "%27")}')"></div>` : '';
    const accionesBotones = `
      <button class="btn btn-outline btn-mini" data-acc="toggle">${activo ? 'Ocultar' : 'Publicar'}</button>
      <button class="btn btn-outline btn-mini" data-acc="editar">Editar</button>
      <button class="btn btn-peligro btn-mini" data-acc="eliminar">Eliminar</button>`;
    return `
      <div class="item" data-id="${escapeHtml(fila.id)}">
        ${thumb}
        <div class="item-info">
          <h4>${escapeHtml(titulo)}</h4>
          ${sub ? `<p>${escapeHtml(sub)}</p>` : ''}
          <span class="item-estado ${activo ? 'visible' : 'oculto'}">${activo ? 'Visible' : 'Oculta/o'}</span>
        </div>
        <div class="item-acciones">${accionesBotones}</div>
      </div>`;
  }).join('');
  listaContainer.innerHTML = filasHtml;
}

// ------------------------- ESTADO CONEXIÓN -------------------------
function actualizarConexion(texto, tipo) {
  estadoConexion.textContent = texto;
  estadoConexion.className = 'conexion ' + (tipo || 'ok');
  estadoConexion.classList.remove('hidden');
}

function mostrarEstadoConexion() {
  if (configurado) {
    actualizarConexion('Conectado a la base de datos (Supabase). Los cambios se publican para todos los visitantes.', 'ok');
  } else {
    actualizarConexion(
      'Modo local: Supabase no está configurado. Los cambios se guardan solo en este navegador. ' +
      'Configura SUPABASE_URL y SUPABASE_ANON_KEY en supabase-config.js para publicar para todos.',
      'warn'
    );
  }
}

// ----------------------------- FORMULARIO ----------------------------
function abrirFormulario(fila) {
  editandoId = fila ? fila.id : null;
  tituloFormulario.textContent = fila ? 'Editar elemento' : 'Añadir nuevo';
  camposForm.innerHTML = seccionActual.campos.map((c) => {
    const valor = fila ? (fila[c.k] ?? '') : (c.k === 'tipo' ? (c.opciones ? c.opciones[0] : '') : '');
    if (c.t === 'textarea') {
      return `<div class="campo"><label>${escapeHtml(c.l)}</label><textarea data-k="${c.k}">${escapeHtml(valor)}</textarea></div>`;
    }
    if (c.t === 'select') {
      const opts = c.opciones.map((o) => `<option value="${o}"${o === valor ? ' selected' : ''}>${o}</option>`).join('');
      return `<div class="campo"><label>${escapeHtml(c.l)}</label><select data-k="${c.k}">${opts}</select></div>`;
    }
    return `<div class="campo"><label>${escapeHtml(c.l)}</label><input type="${c.t === 'text' ? 'text' : c.t}" data-k="${c.k}" value="${escapeHtml(valor)}" /></div>`;
  }).join('');
  formulario.classList.remove('hidden');
}

function cerrarFormulario() {
  formulario.classList.add('hidden');
  editandoId = null;
}

async function guardarFila() {
  const datos = {};
  for (const c of seccionActual.campos) {
    const el = camposForm.querySelector(`[data-k="${c.k}"]`);
    datos[c.k] = (el ? el.value : '').trim();
  }
  if (seccionActual.tabla === 'multimedia' && !datos.url) {
    mostrarMensaje('La galería necesita una URL de imagen.', 'error');
    return;
  }
  const filaNueva = { ...datos, activo: true, orden: filas.length + 1 };
  try {
    if (configurado) {
      if (editandoId) {
        const orig = filas.find((f) => f.id === editandoId);
        if (orig) { filaNueva.activo = orig.activo; filaNueva.orden = orig.orden; }
        await api.actualizar(seccionActual.tabla, editandoId, filaNueva);
      } else {
        await api.crear(seccionActual.tabla, filaNueva);
      }
    } else {
      if (editandoId) {
        const idx = filas.findIndex((f) => f.id === editandoId);
        filas[idx] = { ...filas[idx], ...filaNueva };
      } else {
        filas.push(filaNueva);
      }
      guardarLocal(seccionActual.tabla, filas);
    }
    cerrarFormulario();
    mostrarMensaje('Guardado correctamente.');
    await cargarTabla(seccionActual);
  } catch (err) {
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
  }
}

// --------------------------- ACCIONES LISTA --------------------------
function filaPorId(id) {
  return filas.find((f) => String(f.id) === String(id));
}

async function alternarActivo(fila) {
  const nuevo = { activo: fila.activo === false };
  try {
    if (configurado) {
      await api.actualizar(seccionActual.tabla, fila.id, nuevo);
    } else {
      const idx = filas.indexOf(fila);
      filas[idx].activo = nuevo.activo;
      guardarLocal(seccionActual.tabla, filas);
    }
    await cargarTabla(seccionActual);
  } catch (err) {
    mostrarMensaje('Error: ' + err.message, 'error');
  }
}

async function eliminarFila(fila) {
  if (!confirm('¿Eliminar este elemento definitivamente?')) return;
  try {
    if (configurado) {
      await api.eliminar(seccionActual.tabla, fila.id);
    } else {
      filas = filas.filter((f) => String(f.id) !== String(fila.id));
      guardarLocal(seccionActual.tabla, filas);
    }
    mostrarMensaje('Elemento eliminado.');
    await cargarTabla(seccionActual);
  } catch (err) {
    mostrarMensaje('Error al eliminar: ' + err.message, 'error');
  }
}

function inicializarEventListener() {
  listaContainer.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-acc]');
    if (!btn) return;
    const item = btn.closest('.item');
    const fila = filaPorId(item.dataset.id);
    if (!fila) return;
    const acc = btn.dataset.acc;
    if (acc === 'editar') abrirFormulario(fila);
    if (acc === 'toggle') alternarActivo(fila);
    if (acc === 'eliminar') eliminarFila(fila);
  });
}

// ----------------------------- PESTAÑAS ------------------------------
function construirPestanas() {
  adminTabs.innerHTML = SECCIONES.map((s) =>
    `<button type="button" data-tab="${s.clave}">${escapeHtml(s.nombre)}</button>`
  ).join('');
  adminTabs.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      adminTabs.querySelectorAll('button').forEach((b) => b.classList.remove('activo'));
      btn.classList.add('activo');
      const seccion = SECCIONES.find((s) => s.clave === btn.dataset.tab);
      cargarTabla(seccion);
    });
  });
}

// ----------------------------- AUTENTICACIÓN -------------------------
function estaAutenticado() {
  return sessionStorage.getItem('tejiendo_admin') === '1';
}

function entrar() {
  sessionStorage.setItem('tejiendo_admin', '1');
  loginView.classList.add('hidden');
  panelView.classList.remove('hidden');
  mostrarEstadoConexion();
  construirPestanas();
  cargarTabla(SECCIONES[0]);
}

function salir() {
  sessionStorage.removeItem('tejiendo_admin');
  panelView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

// ----------------------------- EVENTOS -------------------------------
function conectarEventos() {
  $('loginForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const clave = $('loginPass').value;
    if (clave === ADMIN_PASSWORD) {
      $('loginError').classList.add('hidden');
      $('loginPass').value = '';
      entrar();
    } else {
      $('loginError').classList.remove('hidden');
    }
  });
  $('btnLogout').addEventListener('click', salir);
  $('btnNuevo').addEventListener('click', () => abrirFormulario(null));
  $('btnGuardar').addEventListener('click', guardarFila);
  $('btnCancelar').addEventListener('click', cerrarFormulario);
  inicializarEventListener();
}

// ----------------------------- INICIO ---------------------------------
function iniciar() {
  conectarEventos();
  if (estaAutenticado()) {
    entrar();
  } else {
    loginView.classList.remove('hidden');
    panelView.classList.add('hidden');
  }
}
iniciar();