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
      { k: 'autor', l: 'Autor', t: 'text' },
      { k: 'imagen', l: 'Foto (opcional)', t: 'imagen' }
    ]
  },
  {
    clave: 'entradas', nombre: 'Entradas del diario', tabla: 'entradas',
    campos: [
      { k: 'fecha', l: 'Fecha (ej. 15 AGO)', t: 'text' },
      { k: 'titulo', l: 'Título', t: 'text' },
      { k: 'resumen', l: 'Resumen', t: 'textarea' },
      { k: 'imagen', l: 'Foto (opcional)', t: 'imagen' }
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
      { k: 'url', l: 'Imagen', t: 'imagen' }
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
let toastTimer = null;
function mostrarToast(titulo, msg, tipo) {
  const t = $('toast');
  $('toastTitulo').textContent = titulo;
  $('toastMsg').textContent = msg || '';
  $('toastIcon').textContent = tipo === 'error' ? '⚠️' : (tipo === 'warn' ? 'ℹ️' : '✅');
  t.classList.remove('toast-error', 'toast-warn');
  if (tipo === 'error') t.classList.add('toast-error');
  if (tipo === 'warn') t.classList.add('toast-warn');
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(ocultarToast, 5500);
}
function ocultarToast() {
  clearTimeout(toastTimer);
  $('toast').classList.add('hidden');
}

// ------------------------- VISTA PREVIA -------------------------
function alternarPreview() {
  const drawer = $('previewDrawer');
  if (drawer.classList.contains('hidden')) {
    drawer.classList.remove('hidden');
    recargarPreview(true);
  } else {
    drawer.classList.add('hidden');
  }
}
function recargarPreview(forzar = false) {
  const frame = $('previewFrame');
  if (forzar || frame.src === 'about:blank') {
    frame.src = 'index.html';
  } else {
    const src = frame.src;
    frame.src = 'about:blank';
    setTimeout(() => { frame.src = src; }, 60);
  }
}
function cerrarPreview() {
  $('previewDrawer').classList.add('hidden');
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
    const imgVal = fila.imagen || fila.url || '';
    const esImg = /^data:image\//.test(imgVal) || /^https?:\/\//.test(imgVal) || /^data:image\/svg/.test(imgVal);
    const thumb = esImg ? `<img class="item-thumb-img" src="${escapeHtml(imgVal)}" alt="">` : '';
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
// Procesa una imagen elegida: la redimensiona y la convierte a
// data-URI para guardarla (y mostrarla) sin necesidad de servidor.
function procesarImagen(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const escala = Math.min(1, maxDim / Math.max(width, height));
        width = Math.max(1, Math.round(width * escala));
        height = Math.max(1, Math.round(height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const tipo = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(tipo, quality));
      };
      img.onerror = () => reject(new Error('La imagen no se pudo decodificar'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderCampoImagen(c, valor) {
  const preview = valor ? `<img src="${escapeHtml(valor)}" alt="Vista previa">` : '';
  return `
    <div class="campo">
      <label>${escapeHtml(c.l)}</label>
      <div class="img-drop" data-imagen-campo>
        <input type="hidden" data-k="${c.k}" value="${escapeHtml(valor)}" />
        <input type="file" accept="image/*" style="display:none" />
        <input type="url" class="img-url" placeholder="O pega aquí el enlace de una imagen (opcional)" />
        <div class="img-tools">
          <button type="button" class="btn btn-outline btn-sm" data-browse>📷 Añadir foto</button>
          <button type="button" class="btn btn-outline btn-sm" data-remove>Quitar foto</button>
        </div>
        <div class="img-preview" data-preview>${preview}</div>
        <p class="img-ayuda">Pulsa «Añadir foto» o arrastra una imagen aquí desde tu equipo o galería.</p>
      </div>
    </div>`;
}

function configurarSubida(container) {
  const fileInput = container.querySelector('input[type=file]');
  const hidden = container.querySelector('input[type=hidden]');
  const preview = container.querySelector('[data-preview]');
  const urlInput = container.querySelector('.img-url');

  const aplicarArchivo = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      mostrarMensaje('Ese archivo no es una imagen válida.', 'error');
      return;
    }
    try {
      const uri = await procesarImagen(file);
      hidden.value = uri;
      preview.innerHTML = `<img src="${escapeHtml(uri)}" alt="Vista previa">`;
      urlInput.value = '';
      mostrarMensaje('✅ Foto añadida correctamente.');
    } catch (err) {
      mostrarMensaje('No se pudo procesar la imagen: ' + err.message, 'error');
    }
  };

  container.querySelector('[data-browse]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) aplicarArchivo(fileInput.files[0]);
    fileInput.value = '';
  });
  container.addEventListener('dragover', (e) => { e.preventDefault(); container.classList.add('dragover'); });
  container.addEventListener('dragleave', () => container.classList.remove('dragover'));
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files[0]) aplicarArchivo(e.dataTransfer.files[0]);
  });
  container.querySelector('[data-remove]').addEventListener('click', () => {
    hidden.value = '';
    urlInput.value = '';
    preview.innerHTML = '';
  });
  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    hidden.value = val;
    preview.innerHTML = val ? `<img src="${escapeHtml(val)}" alt="Vista previa">` : '';
  });
}

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
    if (c.t === 'imagen') {
      return renderCampoImagen(c, valor);
    }
    return `<div class="campo"><label>${escapeHtml(c.l)}</label><input type="${c.t === 'text' ? 'text' : c.t}" data-k="${c.k}" value="${escapeHtml(valor)}" /></div>`;
  }).join('');
  // Activar subida de imágenes en los campos de foto
  camposForm.querySelectorAll('[data-imagen-campo]').forEach((container) => configurarSubida(container));
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
    mostrarToast('✅ Cambios publicados', 'Ya se reflejan en la web para todos los visitantes.');
    await cargarTabla(seccionActual);
  } catch (err) {
    const esColumna = /column|imagen|does not exist|relation/i.test(err.message || '');
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    mostrarToast(
      '⚠️ No se pudo guardar',
      esColumna
        ? 'Falta una columna en la base de datos. Ejecuta el supabase.sql actualizado en el SQL Editor de Supabase y vuelve a intentar.'
        : err.message || 'Ocurrió un error inesperado.',
      'error'
    );
  }
}

// --------------------------- ACCIONES LISTA --------------------------
function filaPorId(id) {
  return filas.find((f) => String(f.id) === String(id));
}

async function alternarActivo(fila) {
  const publicando = fila.activo === false;
  const nuevo = { activo: publicando };
  try {
    if (configurado) {
      await api.actualizar(seccionActual.tabla, fila.id, nuevo);
    } else {
      const idx = filas.indexOf(fila);
      filas[idx].activo = nuevo.activo;
      guardarLocal(seccionActual.tabla, filas);
    }
    mostrarToast(
      publicando ? '👁 Publicado en la web' : '🙈 Oculto de la web',
      publicando ? 'Los visitantes ya pueden ver este elemento.' : 'Este elemento ya no se muestra en la web.'
    );
    await cargarTabla(seccionActual);
  } catch (err) {
    mostrarMensaje('Error: ' + err.message, 'error');
    mostrarToast('⚠️ No se pudo actualizar', err.message, 'error');
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
    mostrarToast('🗑 Elemento eliminado', 'Se quitó de la web y de la base de datos.');
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
  $('btnPreview').addEventListener('click', alternarPreview);
  $('btnRecargar').addEventListener('click', () => recargarPreview(false));
  $('btnCerrarPreview').addEventListener('click', cerrarPreview);
  $('toastClose').addEventListener('click', ocultarToast);
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