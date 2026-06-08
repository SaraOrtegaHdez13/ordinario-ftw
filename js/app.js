/**
 * app.js — Módulo compartido de Clonspotify
 * Carga el XML, expone utilidades y activa la navegación.
 * Todas las páginas dependen de este archivo.
 */


/* ── CONSTANTES ─────────────────────────────────────────── */

/* Imágenes representativas por género (se usan en barras y miniaturas) */
const GENRE_ICONS = {
  Balada:      'resources/Balada.jpg',
  Salsa:       'resources/Salsa.jpg',
  Cumbia:      'resources/Cumbia.jpg',
  Videojuegos: 'resources/Videojuegos.jpg',
  Banda:       'resources/Banda.gif',
  Rock:        'resources/Rock.jpg',
  Bolero:      'resources/Boleros.jpg',
  PopLatino:   'resources/PopLatino.jpg',
};

/* Colores de acento por género para las barras de estadísticas */
const GENRE_COLORS = {
  Balada:      '#a855f7',
  Salsa:       '#ec4899',
  Cumbia:      '#f97316',
  Videojuegos: '#22d3ee',
  Banda:       '#fbbf24',
  Rock:        '#34d399',
  Bolero:      '#fb7185',
  PopLatino:   '#818cf8',
  Otro:        '#6b7280'
};


/* ── UTILIDADES XML ─────────────────────────────────────── */

/**
 * Lee el texto de la primera etiqueta `tag` dentro de `nodo`.
 * Devuelve cadena vacía si no existe.
 */
function txt(nodo, tag) {
  const el = nodo.querySelector(tag);
  return el ? el.textContent.trim() : '';
}

/**
 * Convierte un número (0-5) en una cadena de estrellas.
 * Ejemplo: estrellas(3) → '★★★☆☆'
 */
function estrellas(n) {
  const num = Math.min(5, Math.max(0, parseInt(n) || 0));
  return '★'.repeat(num) + '☆'.repeat(5 - num);
}

/**
 * Cuenta cuántos artistas únicos hay en el arreglo de canciones.
 * Usa el atributo id del nodo <artista> como clave; si no hay id, usa el nombre.
 */
function artistasUnicos(canciones) {
  const vistos = new Set();
  canciones.forEach(c => {
    const artNodo = c.querySelector('artista');
    const key = artNodo?.getAttribute('id') || txt(c, 'nombre');
    if (key) vistos.add(key);
  });
  return vistos.size;
}

/**
 * Devuelve un arreglo de [género, cantidad] ordenado de mayor a menor.
 * Se usa para pintar las barras de géneros.
 */
function contarPorGenero(canciones) {
  const mapa = {};
  canciones.forEach(c => {
    const g = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
    mapa[g] = (mapa[g] || 0) + 1;
  });
  return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
}


/* ── CARGA DEL XML ──────────────────────────────────────── */

/**
 * Carga y parsea data/canciones.xml.
 * Devuelve una Promise con { canciones, playlists, version }.
 */
function cargarXML() {
  const url = 'data/canciones.xml';

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
      return res.text();
    })
    .then(xmlStr => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, 'application/xml');

      /* Si el XML tiene errores de sintaxis, el parser inserta un nodo <parsererror> */
      const err = xml.querySelector('parsererror');
      if (err) throw new Error('XML inválido: ' + err.textContent.slice(0, 120));

      return {
        canciones: [...xml.querySelectorAll('cancion')],
        playlists: [...xml.querySelectorAll('playlist')],
        version:   xml.querySelector('biblioteca')?.getAttribute('version') || '1.0'
      };
    });
}

/**
 * Carga y parsea data/usuarios.xml.
 * Devuelve una Promise con un arreglo de nodos <usuario>.
 */
function cargarUsuarios() {
  const url = 'data/usuarios.xml';

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
      return res.text();
    })
    .then(xmlStr => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, 'application/xml');

      const err = xml.querySelector('parsererror');
      if (err) throw new Error('XML inválido: ' + err.textContent.slice(0, 120));

      return [...xml.querySelectorAll('usuario')];
    });
}

/**
 * Muestra un mensaje de error amigable en el <main> cuando falla la carga del XML.
 * Se usa como callback del .catch() en cada página.
 */
function mostrarErrorCarga(err) {
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    <div style="padding:3rem;text-align:center;color:var(--pink)">
      <p style="font-size:1.2rem;margin-bottom:1rem">⚠ Error al cargar el XML</p>
      <p style="color:var(--text3);font-size:0.9rem">${err.message}</p>
      <p style="color:var(--text3);font-size:0.85rem;margin-top:0.8rem">
        Sirve los archivos con un servidor local (Live Server en VS Code, o <code>python -m http.server</code>).
      </p>
    </div>`;
}


/* ── NAVEGACIÓN ─────────────────────────────────────────── */

/* Activa el botón hamburguesa en móvil */
function initNavToggle() {
  const btn   = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  /* Alterna la clase 'open' al hacer clic */
  btn.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  /* Cierra el menú al hacer clic en cualquier enlace */
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });
}

/* Resalta el enlace del nav que corresponde a la página actual */
function marcarNavActivo() {
  const actual = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    a.classList.toggle('active', href === actual);
  });
}


/* ── INICIALIZACIÓN ─────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  marcarNavActivo();
});


/* ── EXPORTAR AL SCOPE GLOBAL ───────────────────────────── */

/* Todas las páginas acceden a estas funciones a través de window.CS */
window.CS = {
  GENRE_ICONS,
  GENRE_COLORS,
  txt,
  estrellas,
  artistasUnicos,
  contarPorGenero,
  cargarXML,
  cargarUsuarios,
  mostrarErrorCarga
};