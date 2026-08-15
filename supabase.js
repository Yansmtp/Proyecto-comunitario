// ============================================================
//  supabase.js - Cliente REST de Supabase
//  No requiere librerías externas: usa la API REST de Supabase
//  con las credenciales de supabase-config.js
//  ============================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

// Indica si Supabase está configurado (URL y key no vacías)
export const configurado = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const BASE = SUPABASE_URL;
const KEY = SUPABASE_ANON_KEY;

async function request(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`
  };
  const cfg = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cfg.body = JSON.stringify(body);
  }
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${BASE}/rest/v1/${path}`, cfg);
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    const json = await res.json().catch(() => null);
    if (json) {
      if (json.message) msg = json.message;
      if (json.hint) msg += ` — ${json.hint}`;
    } else {
      const texto = await res.text().catch(() => '');
      if (texto) msg = texto.slice(0, 300);
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 || res.status === 201 && body === undefined ? null : res.json();
}

export const api = {
  // Lista todos los registros de una tabla
  async listar(tabla, { incluirInactivos = false, orden = 'orden' } = {}) {
    let q = `?select=*&order=${orden}.asc`;
    if (!incluirInactivos) q += `&activo=eq.true`;
    return request(`${tabla}${q}`);
  },

  // Crea uno o varios registros y devuelve los insertados
  async crear(tabla, fila) {
    const filas = Array.isArray(fila) ? fila : [fila];
    return request(`${tabla}?select=*`, { method: 'POST', body: filas, prefer: 'return=representation' });
  },

  // Actualiza un registro por su id
  async actualizar(tabla, id, fila) {
    return request(`${tabla}?id=eq.${id}&select=*`, {
      method: 'PATCH',
      body: fila,
      prefer: 'return=representation'
    });
  },

  // Elimina un registro por su id
  async eliminar(tabla, id) {
    return request(`${tabla}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
};