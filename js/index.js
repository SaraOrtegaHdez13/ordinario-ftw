document.addEventListener('DOMContentLoaded', () => {

  // Importamos las funciones y constantes que necesitamos desde app.js,
  // que las expone globalmente en window.CS
  const { cargarXML, mostrarErrorCarga,
          txt, estrellas, contarPorGenero,
          artistasUnicos, GENRE_ICONS, GENRE_COLORS } = window.CS;

  // Cargamos el XML con todas las canciones y playlists,
  // y cuando termina llamamos a cada función de renderizado
  cargarXML()
    .then(({ canciones, playlists }) => {
      renderStats(canciones);              // Tarjetas de resumen (total, artistas, favoritas, géneros)
      renderRecientes(canciones);          // Lista de las últimas 5 canciones
      renderGeneroBars(canciones);         // Barras de cantidad por género
      renderFavoritasPreview(canciones);   // Tarjetas de las primeras 4 favoritas
      renderPlaylistsPreview(playlists, canciones); // Tarjetas de las primeras 3 playlists
    })
    .catch(mostrarErrorCarga); // Si algo falla, muestra un mensaje de error en pantalla


  /* Tarjetas de resumen */
  function renderStats(canciones) {

    // Contamos cuántas canciones tienen favorita = true
    const favs = canciones.filter(c => txt(c, 'favorita') === 'true').length;

    // Obtenemos los géneros únicos usando un Set (no repite valores)
    const generos = new Set(
      canciones.map(c => c.querySelector('genero')?.getAttribute('tipo')).filter(Boolean)
    ).size;

    // Insertamos los valores en los elementos HTML correspondientes
    document.getElementById('stat-total').textContent     = canciones.length;
    document.getElementById('stat-artistas').textContent  = artistasUnicos(canciones);
    document.getElementById('stat-favoritas').textContent = favs;
    document.getElementById('stat-generos').textContent   = generos;
  }


  /* Últimas 5 canciones  */
  function renderRecientes(canciones) {
    const lista = document.getElementById('lista-recientes');

    // Tomamos las últimas 5 canciones del arreglo y las invertimos
    // para que la más reciente aparezca primero
    const ultimas = canciones.slice(-5).reverse();

    // Generamos el HTML de cada canción como un <li>
    lista.innerHTML = ultimas.map(c => {
      const tipo    = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
      const portada = txt(c, 'portada'); // Ruta de la imagen de portada
      return `
        <li class="song-item">
          <div class="song-thumb">
            <img src="${portada}" class="nav-icon">
          </div>
          <div class="song-info">
            <div class="song-title">${txt(c, 'titulo')}</div>
            <div class="song-artist">${txt(c, 'nombre')}</div>
          </div>
        </li>`;
    }).join('');
  }


  /* Barras de géneros (panel inicio) */
  function renderGeneroBars(canciones) {
    const contenedor = document.getElementById('genre-bars');

    // Obtenemos los géneros ordenados de mayor a menor cantidad
    const datos = contarPorGenero(canciones);
    const max = datos[0]?.[1] || 1;

    // El género con más canciones será el 100% de la barra

    // Generamos una fila por cada género con su imagen, barra y contador
    contenedor.innerHTML = datos.map(([label, count]) => {
      const pct   = Math.round((count / max) * 100); // Porcentaje relativo al máximo
      const color = 'linear-gradient(90deg, var(--purple), var(--purple-l))';
      return `
        <div class="genre-row">
          <span class="genre-name" title="${label}">
            <img src="${GENRE_ICONS[label] || GENRE_ICONS.Otro}" class="genre-img">
            ${label.length > 12 ? label.slice(0, 12) + '…' : label}
          </span>
          <div class="genre-track">
            <div class="genre-fill" style="width:0;background:${color}" data-pct="${pct}"></div>
          </div>
          <span class="genre-count">${count}</span>
        </div>`;
    }).join('');

    // Animamos las barras después de un pequeño retraso para que se vea la transición CSS
    setTimeout(() => {
      contenedor.querySelectorAll('.genre-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    }, 80);
  }


  /* Preview de favoritas (máx 4 tarjetas) */
  function renderFavoritasPreview(canciones) {
    const grid = document.getElementById('grid-favoritas-preview');

    // Filtramos solo las canciones marcadas como favoritas y tomamos las primeras 4
    const favs = canciones.filter(c => txt(c, 'favorita') === 'true').slice(0, 4);

    // Si no hay favoritas mostramos un mensaje y salimos
    if (!favs.length) {
      grid.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No hay favoritas aún.</p>';
      return;
    }

    // Generamos una tarjeta por cada canción favorita
    grid.innerHTML = favs.map(c => {
      const tipo  = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
      const stars = c.querySelector('calificacion')?.getAttribute('estrellas') || '0';
      return `
        <article class="fav-card fade-in">
          <div class="fav-card-thumb">
            <!-- Mostramos la portada; si no carga, usamos el ícono del género como respaldo -->
            <img src="${txt(c, 'portada')}" class="genre-img" onerror="this.src='${GENRE_ICONS[tipo]}'">
          </div>
          <div class="fav-card-title">${txt(c, 'titulo')}</div>
          <div class="fav-card-artist">${txt(c, 'nombre')}</div>
          <div class="fav-card-meta">
            <span class="fav-card-genre">${tipo}</span>
            <span class="fav-card-stars">${estrellas(stars)}</span>
          </div>
        </article>`;
    }).join('');
  }


  /* Preview de playlists (máx 3) */
  function renderPlaylistsPreview(playlists, canciones) {
    const grid = document.getElementById('playlist-preview');
    if (!grid) return;

    // Creamos un mapa id → canción para buscar rápidamente por ID
    const porId = {};
    canciones.forEach(c => { porId[c.getAttribute('id')] = c; });

    // Tomamos solo las primeras 3 playlists para el preview
    const muestra = playlists.slice(0, 3);

    // Si no hay playlists mostramos un mensaje y salimos
    if (!muestra.length) {
      grid.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No hay playlists aún.</p>';
      return;
    }

    // Generamos una tarjeta por cada playlist
    grid.innerHTML = muestra.map(pl => {
      const nombre  = txt(pl, 'nombrePlaylist');
      const desc    = txt(pl, 'descripcion');
      const publica = pl.getAttribute('publica') === 'si'; // true si es pública
      const items   = [...pl.querySelectorAll('item')];
      const total   = items.length; // Total de canciones en la playlist

      // Generamos una fila por cada una de las primeras 3 canciones de la playlist
      const preview = items.slice(0, 3).map(item => {
        const c = porId[item.getAttribute('refCancion')]; // Buscamos la canción por su ID
        if (!c) return ''; // Si no existe la canción, no renderizamos nada
        const tipo = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
        return `
          <div class="playlist-song-row">
            <!-- Portada de la canción con respaldo al ícono del género -->
            <img src="${txt(c, 'portada')}" class="song-thumb-sm" onerror="this.src='${GENRE_ICONS[tipo]}'">
            <span class="playlist-song-title">${txt(c, 'titulo')}</span>
            <span class="playlist-song-artist">— ${txt(c, 'nombre')}</span>
          </div>`;
      }).join('');

      return `
        <article class="playlist-card fade-in">
          <div class="playlist-header">
            <h3 class="playlist-name">${nombre}</h3>
            <span class="${publica ? 'playlist-badge-pub' : 'playlist-badge-priv'}">
              ${publica ? 'Pública' : 'Privada'}
            </span>
          </div>
          ${desc ? `<p class="playlist-desc">${desc}</p>` : ''}
          <div class="playlist-songs">${preview}</div>
          <div class="playlist-actions">
            <span style="font-size:0.8rem;color:var(--text3)">
              ${total} cancion${total !== 1 ? 'es' : ''}
            </span>
          </div>
        </article>`;
    }).join('');
  }

});