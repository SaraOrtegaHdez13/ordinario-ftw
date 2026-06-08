/**
 * Renderiza las playlists del XML con sus canciones,
 * gestiona filtros en tiempo real, y maneja el modal
 * para crear nuevas playlists dinámicamente.
 */

document.addEventListener('DOMContentLoaded', () => {
  const { cargarXML, mostrarErrorCarga,
          txt, GENRE_ICONS } = window.CS;

  /** Playlists originales del XML */
  let playlists = [];
  /** Playlists creadas dinámicamente en esta sesión */
  let playlistsNuevas = [];
  /** Mapa de id → nodo cancion */
  let cancionPorId = {};

  const grid        = document.getElementById('grid-playlists');
  const inputBuscar = document.getElementById('buscar-pl');
  const selVis      = document.getElementById('filtro-pl-visibilidad');
  const contador    = document.getElementById('pl-count');

  /* Carga  */
  cargarXML()
    .then(({ canciones, playlists: pls }) => {
      playlists = pls;
      canciones.forEach(c => { cancionPorId[c.getAttribute('id')] = c; });
      renderPlaylists(todasPlaylists());
    })
    .catch(mostrarErrorCarga);

  /** Combina playlists del XML con las creadas en sesión */
  function todasPlaylists() {
    return [...playlists, ...playlistsNuevas];
  }

  /* Filtros  */
  [inputBuscar, selVis].forEach(el =>
    el.addEventListener('input', () => {
      const busq = inputBuscar.value.trim().toLowerCase();
      const vis  = selVis.value;
      const filtradas = todasPlaylists().filter(pl => {
        const nombre = getPlNombre(pl).toLowerCase();
        const pub    = getPlPublica(pl);
        if (busq && !nombre.includes(busq)) return false;
        if (vis  && pub !== vis) return false;
        return true;
      });
      renderPlaylists(filtradas);
    })
  );

  /* Helpers para acceder a propiedades de playlist */
  function getPlNombre(pl) {
    return pl.nombrePlaylist ?? txt(pl, 'nombrePlaylist');
  }
  function getPlDesc(pl) {
    return pl.descripcion ?? txt(pl, 'descripcion');
  }
  function getPlPublica(pl) {
    if (pl.publica !== undefined) return pl.publica ? 'si' : 'no';
    return pl.getAttribute?.('publica') || 'no';
  }
  function getPlItems(pl) {
    if (pl.items) return pl.items;
    return [...pl.querySelectorAll('item')].map(item => ({
      orden: item.getAttribute('orden'),
      id:    item.getAttribute('refCancion')
    }));
  }

  /*Render  */
  function renderPlaylists(lista) {
    const n = lista.length;
    contador.textContent = `${n} playlist${n !== 1 ? 's' : ''}`;

    if (!n) {
      grid.innerHTML = `
        <div class="empty-state">
          <img src="resources/playlist.svg" class="empty-state-icon">
          <p>No hay playlists con esos criterios.</p>
        </div>`;
      return;
    }

    grid.innerHTML = lista.map(pl => {
      const nombre  = getPlNombre(pl);
      const desc    = getPlDesc(pl);
      const publica = getPlPublica(pl) === 'si';
      const items   = getPlItems(pl).slice(0, 5);

      const cancsHTML = items.map(item => {
        const c = cancionPorId[item.id];
        if (!c) return '';
        const tipo    = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
        const portada = txt(c, 'portada');
        return `
          <div class="playlist-song-row2">
            <span class="playlist-song-num">${item.orden}</span>
            <img src="${portada}" class="song-thumb-sm"
                 onerror="this.src='${GENRE_ICONS[tipo] || GENRE_ICONS.Balada}'">
            <span class="playlist-song-title2">${txt(c, 'titulo')}</span>
            <span class="playlist-song-artist2">— ${txt(c, 'nombre')}</span>
          </div>`;
      }).join('');

      const totalCanciones = getPlItems(pl).length;

      return `
        <article class="playlist-card fade-in"
                 aria-label="Playlist: ${nombre}, ${totalCanciones} canciones, ${publica ? 'pública' : 'privada'}">
          <div class="playlist-header">
            <h3 class="playlist-name">${nombre}</h3>
            <span class="${publica ? 'playlist-badge-pub' : 'playlist-badge-priv'}">
              ${publica ? '🌐 pública' : '🔒 privada'}
            </span>
          </div>
          ${desc ? `<p class="playlist-desc">${desc}</p>` : ''}
          <div class="playlist-songs" aria-label="Canciones en ${nombre}">
            ${cancsHTML || '<p class="playlist-empty">Sin canciones aún.</p>'}
            ${totalCanciones > 5
              ? `<p class="playlist-mas">+${totalCanciones - 5} más…</p>`
              : ''}
          </div>
          <div class="playlist-actions">
            <span class="playlist-total">
              ${totalCanciones} canción${totalCanciones !== 1 ? 'es' : ''}
            </span>
          </div>
        </article>`;
    }).join('');
  }

  /*  Modal */
  const overlay     = document.getElementById('modal-nueva-playlist');
  const btnNueva    = document.getElementById('btn-nueva-playlist');
  const btnClose    = document.getElementById('modal-close-pl');
  const btnCancelar = document.getElementById('btn-cancelar-pl');
  const btnCrear    = document.getElementById('btn-crear-pl');

  const inputNombre = document.getElementById('pl-nombre');
  const inputDesc   = document.getElementById('pl-desc');
  const chkPublica  = document.getElementById('pl-publica');
  const alertOk     = document.getElementById('alert-pl-ok');
  const alertErr    = document.getElementById('alert-pl-err');
  const errNombre   = document.getElementById('pl-nombre-err');

  function abrirModal() {
    overlay.classList.add('open');
    inputNombre.focus();
    document.addEventListener('keydown', trapFocus);
  }

  function cerrarModal() {
    overlay.classList.remove('open');
    resetModal();
    document.removeEventListener('keydown', trapFocus);
    btnNueva.focus();
  }

  function resetModal() {
    inputNombre.value  = '';
    inputDesc.value    = '';
    chkPublica.checked = false;
    inputNombre.classList.remove('error');
    errNombre.classList.remove('visible');
    alertOk.classList.remove('visible');
    alertErr.classList.remove('visible');
  }

  function trapFocus(e) {
    if (e.key === 'Escape') { cerrarModal(); return; }
    if (e.key !== 'Tab') return;
    const focusables = overlay.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  btnNueva.addEventListener('click', abrirModal);
  btnClose.addEventListener('click', cerrarModal);
  btnCancelar.addEventListener('click', cerrarModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });

  /*  Crear playlist  */
  btnCrear.addEventListener('click', () => {
    alertOk.classList.remove('visible');
    alertErr.classList.remove('visible');

    const nombre = inputNombre.value.trim();
    if (!nombre) {
      inputNombre.classList.add('error');
      errNombre.classList.add('visible');
      inputNombre.focus();
      return;
    }
    inputNombre.classList.remove('error');
    errNombre.classList.remove('visible');

    const nueva = {
      nombrePlaylist: nombre,
      descripcion:    inputDesc.value.trim(),
      publica:        chkPublica.checked,
      items:          []
    };
    playlistsNuevas.unshift(nueva);

    alertOk.querySelector('#alert-pl-ok-msg').textContent =
      `Playlist "${nombre}" creada exitosamente.`;
    alertOk.classList.add('visible');

    renderPlaylists(todasPlaylists());
    setTimeout(cerrarModal, 1500);
  });
});