/**

 * Este archivo es el NÚCLEO COMPARTIDO de la aplicación.
 * Todos los demás módulos (páginas individuales) dependen de él.
 *
 * Sus responsabilidades son:
 *   1. Definir constantes globales de configuración visual
 *      (íconos y colores por género musical).
 * 
 *   2. Exponer funciones utilitarias de uso común para
 *      manipular nodos XML y formatear datos.
 * 
 *   3. Cargar y parsear los archivos XML de datos
 *      (canciones y usuarios) desde el servidor.
 * 
 *   4. Mostrar mensajes de error amigables si la carga falla.
 *   5. Inicializar la navegación responsive (hamburguesa).
 * 
 *   6. Exportar todo lo anterior al objeto global `window.CS`
 *      para que cualquier página pueda accederlo.
 
 */


/* 
   SECCIÓN 1 — CONSTANTES GLOBALES
   Valores fijos que no cambian durante la ejecución.
   Se centralizan aquí para evitar repetirlos en cada página.
 */

const GENRE_ICONS = {
  Balada:      'resources/Balada.jpg',
  Salsa:       'resources/Salsa.jpg',
  Cumbia:      'resources/Cumbia.jpg',
  Videojuegos: 'resources/Videojuegos.jpg',
  Banda:       'resources/Banda.gif',  // 
  Rock:        'resources/Rock.jpg',
  Bolero:      'resources/Boleros.jpg',
  PopLatino:   'resources/PopLatino.jpg',
};


const GENRE_COLORS = {
  Balada:      '#a855f7',  // morado
  Salsa:       '#ec4899',  // rosa
  Cumbia:      '#f97316',  // naranja
  Videojuegos: '#22d3ee',  // cian
  Banda:       '#fbbf24',  // ámbar
  Rock:        '#34d399',  // verde menta
  Bolero:      '#fb7185',  // rosa coral
  PopLatino:   '#818cf8',  // índigo suave
  Otro:        '#6b7280'   // gris (fallback)
};


/* 
   SECCIÓN 2 — FUNCIONES UTILITARIAS XML
   Helpers puros (sin efectos secundarios) que procesan
   nodos del DOM XML y devuelven valores derivados.
*/

/**
 * txt(nodo, tag)
 * -------------
 * Lee el contenido de texto de la primera etiqueta `tag`
 * encontrada como descendiente de `nodo`.
 *
 * Internamente usa querySelector, que busca en profundidad
 * (no solo hijos directos), por lo que funciona incluso si
 * la etiqueta está anidada varios niveles abajo.
 *
 * Se aplica .trim() para eliminar espacios y saltos de línea
 * que el XML puede incluir por sangría o formato.
 *
 * @param  {Element} nodo  - Nodo XML de la canción (o cualquier elemento)
 * @param  {string}  tag   - Nombre de la etiqueta a buscar, p.ej. 'titulo'
 * @returns {string}         Contenido de texto, o '' si la etiqueta no existe

 */
function txt(nodo, tag) {
  const el = nodo.querySelector(tag);
  return el ? el.textContent.trim() : '';
}

/**
 * estrellas(n)
 * ------------
 * Convierte un número de calificación (0–5) en una cadena
 * visual de estrellas Unicode para mostrar en la interfaz.
 *
 * Usa:
 *   ★  (U+2605) para estrellas LLENAS  → calificación obtenida
 *   ☆  (U+2606) para estrellas VACÍAS  → calificación faltante
 *
 * Incluye protección de rango: si `n` es mayor a 5 se recorta
 * a 5, y si es negativo o NaN se trata como 0. Esto evita que
 * datos malformados del XML rompan la visualización.
 *
 * @param  {number|string} n - Calificación (se convierte a int internamente)
 * @returns {string}           Cadena de 5 caracteres, p.ej. '★★★☆☆'
 */
function estrellas(n) {
  // parseInt convierte string a entero; '|| 0' maneja NaN
  const num = Math.min(5, Math.max(0, parseInt(n) || 0));
  return '★'.repeat(num) + '☆'.repeat(5 - num);
}

/**
 * artistasUnicos(canciones)
 * -------------------------
 * Cuenta cuántos artistas DISTINTOS aparecen en un arreglo
 * de nodos <cancion>, evitando contar al mismo artista dos veces.
 *
 * ESTRATEGIA DE DEDUPLICACIÓN:
 * Se usa un Set (conjunto sin duplicados) como acumulador.
 * Para cada canción se extrae la clave de identidad del artista:
 *
 *   1.ª opción → atributo `id` del elemento <artista>
 *                Ej: <artista id="A01">Juan Gabriel</artista>
 *                Se prefiere el id porque es estable aunque el
 *                nombre tenga variaciones de ortografía.
 *
 *   Fallback   → si no hay id, se usa el nombre de la canción
 *                como aproximación (campo 'nombre', no 'artista').
 *                Esto es un fallback imperfecto pero evita crash.
 *
 * @param  {Element[]} canciones - Arreglo de nodos <cancion> del XML
 * @returns {number}               Cantidad de artistas únicos encontrados
 *
 */
function artistasUnicos(canciones) {
  const vistos = new Set();  // Set descarta automáticamente duplicados

  canciones.forEach(c => {
    // Busca el nodo <artista> dentro de <cancion>
    const artNodo = c.querySelector('artista');

    // Intenta usar el atributo id; si no existe, usa el nombre de la canción
    const key = artNodo?.getAttribute('id') || txt(c, 'nombre');

    // Solo agrega si la clave tiene algún valor (evita claves vacías)
    if (key) vistos.add(key);
  });

  return vistos.size;  // .size equivale a .length en arrays
}

/**
 * contarPorGenero(canciones)
 * --------------------------
 * Genera un resumen de cuántas canciones hay por cada género,
 * devuelto como un arreglo ordenado de mayor a menor cantidad.
 *
 * PROCESO INTERNO:
 *   1. Recorre todas las canciones y lee el atributo `tipo`
 *      del elemento <genero>. Si no existe, usa 'Otro' como
 *      categoría de fallback.
 * 
 *   2. Acumula los conteos en un objeto plano (mapa género→cantidad).
 *   3. Convierte el objeto a arreglo de pares [género, cantidad]
 *      usando Object.entries().
 * 
 *   4. Ordena el arreglo de forma descendente por cantidad.
 *
 * El resultado ordenado permite pintar las barras de género
 * con la más popular primero, de forma natural.
 *
 * @param  {Element[]} canciones - Arreglo de nodos <cancion> del XML
 * @returns {[string, number][]}   Arreglo de pares [género, cantidad]
 *                                 ordenado de mayor a menor.
 */
function contarPorGenero(canciones) {
  const mapa = {};  // Objeto acumulador: { 'Balada': 8, 'Rock': 5, ... }

  canciones.forEach(c => {
    // Lee el atributo 'tipo' del elemento <genero>; fallback a 'Otro'
    const g = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';

    // Si el género ya existe en el mapa, suma 1; si no, inicializa en 1
    mapa[g] = (mapa[g] || 0) + 1;
  });

  // Convierte a arreglo y ordena descendentemente por la cantidad (b[1] - a[1])
  return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
}


/* 
   SECCIÓN 3 — CARGA ASÍNCRONA DE DATOS XML

   Funciones que realizan peticiones HTTP para obtener los
   archivos de datos y convertirlos en estructuras utilizables.

   Ambas devuelven Promises para integrarse con .then()/.catch()
   o async/await en los módulos de cada página. */

/**
 * cargarXML()
 * -----------
 * Obtiene y parsea el archivo principal de datos musicales:
 * `data/canciones.xml`.
 *
 * ESTRUCTURA ESPERADA DEL XML:
 * <biblioteca version="1.0">
 *   <cancion> ... </cancion>
 *   <cancion> ... </cancion>
 *   <playlist> ... </playlist>
 * </biblioteca>
 *
 * FLUJO INTERNO:
 *   fetch(url)         → Solicitud HTTP al servidor local
 *   res.ok             → Verifica que el servidor respondió 200
 *   res.text()         → Lee el cuerpo como texto plano (string XML)
 *   DOMParser          → Motor nativo del navegador para parsear XML
 *   parsererror        → Nodo especial que el parser inserta si el XML
 *                        tiene errores de sintaxis (etiquetas sin cerrar, etc.)
 *   querySelectorAll   → Selecciona todos los nodos de un tipo
 *   getAttribute       → Lee atributos del nodo raíz <biblioteca>
 *
 * @returns {Promise<{
 *   canciones: Element[],   - Todos los nodos <cancion>
 *   playlists: Element[],   - Todos los nodos <playlist>
 *   version:   string       - Valor del atributo 'version' de <biblioteca>
 * }>}
 *
 * @throws {Error} Si el servidor retorna un código de error HTTP,
 *                 o si el XML contiene errores de sintaxis.
 */
function cargarXML() {
  const url = 'data/canciones.xml';  // Ruta relativa desde index.html

  return fetch(url)
    .then(res => {
      // Verifica que la respuesta HTTP sea exitosa (código 200–299)
      // res.ok es false para códigos 4xx y 5xx (404, 500, etc.)
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);

      // Extrae el cuerpo completo de la respuesta como string de texto
      return res.text();
    })
    .then(xmlStr => {
      // DOMParser es la API nativa del navegador para procesar XML/HTML
      const parser = new DOMParser();

      // Parsea el string XML y devuelve un Document (similar al DOM del HTML)
      // El segundo argumento 'application/xml' le dice al parser que es XML puro
      const xml = parser.parseFromString(xmlStr, 'application/xml');

      // Cuando el XML tiene errores de sintaxis, DOMParser NO lanza excepción;
      // en cambio, inserta un nodo <parsererror> con la descripción del fallo.
      // Por eso debemos buscarlo manualmente y lanzar el error nosotros.
      const err = xml.querySelector('parsererror');
      if (err) throw new Error('XML inválido: ' + err.textContent.slice(0, 120));

      // Retorna un objeto con las tres colecciones de datos útiles
      return {
        // [...iterableNodeList] convierte NodeList a Array nativo de JS,
        // lo que habilita métodos como .filter(), .map(), .reduce(), etc.
        canciones: [...xml.querySelectorAll('cancion')],
        playlists: [...xml.querySelectorAll('playlist')],

        // Lee el atributo 'version' del nodo raíz; usa '1.0' como valor por defecto
        version: xml.querySelector('biblioteca')?.getAttribute('version') || '1.0'
      };
    });
}

/**
 * cargarUsuarios()
 * ----------------
 * Obtiene y parsea el archivo de usuarios registrados:
 * `data/usuarios.xml`.
 *
 * ESTRUCTURA ESPERADA DEL XML:
 * <usuarios>
 *   <usuario id="U01">
 *     <nombre>...</nombre>
 *     <password>...</password>
 *     ...
 *   </usuario>
 * </usuarios>
 *
 * Sigue exactamente el mismo patrón que cargarXML() pero
 * retorna directamente un arreglo plano de nodos <usuario>,
 * sin el objeto envolvente, ya que no hay más tipos de nodos
 * relevantes en ese archivo.
 *
 * @returns {Promise<Element[]>} Arreglo de nodos <usuario>
 *
 * @throws {Error} Si el servidor retorna un código de error HTTP,
 *                 o si el XML contiene errores de sintaxis.
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

      // A diferencia de cargarXML(), aquí solo necesitamos los nodos <usuario>
      return [...xml.querySelectorAll('usuario')];
    });
}

/**
 * mostrarErrorCarga(err)
 * ----------------------
 * Muestra un mensaje de error amigable en el área principal
 * de la página cuando falla la carga del XML.
 *
 * Reemplaza TODO el contenido del elemento <main> con un
 * aviso visual que incluye:
 *   - El mensaje técnico del error (para depuración)
 *   - Un consejo de cómo resolverlo (usar servidor local)
 *
 * Se usa como callback de .catch() en todos los módulos:
 *   cargarXML().then(inicializar).catch(mostrarErrorCarga)
 *
 * El atributo role="alert" hace que los lectores de pantalla
 * anuncien el error automáticamente (accesibilidad).
 *
 * @param {Error} err - El objeto de error capturado por el catch
 * @returns {void}      No devuelve nada; modifica el DOM directamente
 */
function mostrarErrorCarga(err) {
  const main = document.querySelector('main');

  // Guard clause: si no existe <main> en la página, no hacer nada
  if (!main) return;

  // Reemplaza el contenido del main con el mensaje de error
  // Se usan estilos inline para que el mensaje sea visible incluso
  // si los estilos del CSS no cargaron correctamente
  main.innerHTML = `
    <div role="alert" style="padding:3rem;text-align:center;color:var(--pink)">
      <p style="font-size:1.2rem;margin-bottom:1rem">⚠ Error al cargar el XML</p>
      <p style="color:var(--text3);font-size:0.9rem">${err.message}</p>
      <p style="color:var(--text3);font-size:0.85rem;margin-top:0.8rem">
        Sirve los archivos con un servidor local (Live Server en VS Code, o <code>python -m http.server</code>).
      </p>
    </div>`;
}


/*
   SECCIÓN 4 — NAVEGACIÓN RESPONSIVE
   Funciones que controlan el comportamiento del menú de
   navegación en pantallas pequeñas (móvil y tablet).
 */

/**
 * initNavToggle()
 * ---------------
 * Conecta el botón hamburguesa del header con la lista de
 * enlaces del nav para mostrarla/ocultarla en móvil.
 *
 * El toggle se maneja únicamente con la clase CSS 'open'
 * en #nav-links, que el CSS ya espera (.nav-links.open { display: flex }).
 *
 * @returns {void}
 */
function initNavToggle() {
  const btn   = document.getElementById('nav-toggle');   // Botón hamburguesa ☰
  const links = document.getElementById('nav-links');    // Lista <ul> de enlaces

  // Guard clause: si algún elemento no existe, no hace nada
  // (previene errores en páginas que quizás no tienen nav responsive)
  if (!btn || !links) return;

  // Cada clic alterna la clase 'open': la agrega si no está, la quita si está
  btn.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Auto-cierre: cuando el usuario hace clic en cualquier enlace del nav,
  // el menú se cierra automáticamente (comportamiento estándar en móvil)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });
}

/**
 * marcarNavActivo()
 * -----------------
 * Resalta visualmente el enlace del nav que corresponde
 * a la página actualmente abierta en el navegador.
 *
 * CÓMO DETECTA LA PÁGINA ACTUAL:
 *   location.pathname  → ruta completa: '/proyecto/catalogo.html'
 *   .split('/')        → ['', 'proyecto', 'catalogo.html']
 *   .pop()             → 'catalogo.html'  (último segmento)
 *   || 'index.html'    → fallback para la raíz '/'
 *
 * CÓMO COMPARA:
 *   Extrae solo el nombre del archivo de cada href del nav
 *   (ignorando la carpeta) y compara con el nombre actual.
 *   Esto permite que los hrefs sean relativos o absolutos.
 *
 * EFECTO VISUAL:
 *   Agrega la clase 'active' al enlace actual → el CSS aplica
 *   fondo morado (.nav-links a.active { color: var(--purple) }).
 *
 * @returns {void}
 */
function marcarNavActivo() {
  // Extrae solo el nombre del archivo de la URL actual
  const actual = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('#nav-links a').forEach(a => {
    // Extrae solo el nombre del archivo del href de cada enlace
    const href = a.getAttribute('href').split('/').pop();

    // toggle(clase, bool): agrega la clase si bool es true, la quita si false
    a.classList.toggle('active', href === actual);
  });
}


/* ══════════════════════════════════════════════════════════
   SECCIÓN 5 — INICIALIZACIÓN AUTOMÁTICA
   Se ejecuta cuando el DOM está completamente cargado.
   Solo inicializa funcionalidades que no dependen del XML
   (el XML lo carga cada página individualmente).
   ══════════════════════════════════════════════════════════ */

/**
 * Listener de 'DOMContentLoaded':
 * Se dispara cuando el navegador ha terminado de parsear el
 * HTML y construir el árbol DOM, pero ANTES de que se carguen
 * imágenes y otros recursos externos.
 *
 * Es el momento correcto para inicializar interacciones del
 * nav, ya que los elementos ya existen en el DOM.
 *
 * Nota: No usamos window.onload porque ese evento espera a que
 * TODAS las imágenes y recursos carguen, lo que retrasa la
 * interactividad innecesariamente.
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();   // Activa la hamburguesa en móvil
  marcarNavActivo(); // Resalta el enlace de la página actual
});


/* ══════════════════════════════════════════════════════════
   SECCIÓN 6 — EXPORTACIÓN AL SCOPE GLOBAL
   Agrupa todo lo que los módulos de cada página necesitan
   bajo el namespace 'window.CS' (CS = Clonspotify).

   Usar un namespace evita contaminar window con decenas de
   variables sueltas y reduce el riesgo de colisiones con
   otras librerías o scripts de terceros.

   CÓMO LO USAN LAS PÁGINAS:
     const { txt, estrellas, cargarXML } = window.CS;
     // o directamente:
     window.CS.cargarXML().then(...)
   ══════════════════════════════════════════════════════════ */
window.CS = {
  // ── Constantes visuales ──────────────────────────────
  GENRE_ICONS,      // Rutas de imágenes por género
  GENRE_COLORS,     // Colores hex por género para gráficas

  // ── Utilidades XML ───────────────────────────────────
  txt,              // Lee el texto de una etiqueta XML
  estrellas,        // Convierte número en string de ★☆
  artistasUnicos,   // Cuenta artistas distintos en un arreglo
  contarPorGenero,  // Resume canciones por género, ordenado

  // ── Carga de datos ───────────────────────────────────
  cargarXML,        // Carga y parsea data/canciones.xml
  cargarUsuarios,   // Carga y parsea data/usuarios.xml
  mostrarErrorCarga // Muestra error amigable en el <main>
};