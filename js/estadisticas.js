/**
 * Calcula y renderiza métricas generales, distribución por
 * género e idioma, top canciones y artistas más representados.
 * Incluye filtrado dinámico por género.
 */

document.addEventListener('DOMContentLoaded', () => {
  const { cargarXML, mostrarErrorCarga,
          txt, estrellas, contarPorGenero,
          artistasUnicos, GENRE_ICONS } = window.CS;

  // Todas las canciones cargadas del XML
  let todasCanciones = [];

  const selGenero  = document.getElementById('filtro-stats-genero');
  const statsScope = document.getElementById('stats-scope');


  /* Carga inicial */
  cargarXML()
    .then(({ canciones }) => {
      todasCanciones = canciones;
      poblarFiltroGenero(canciones);
      renderTodo(canciones);
    })
    .catch(mostrarErrorCarga);


  /* Llenar el desplegable de géneros */
  function poblarFiltroGenero(canciones) {
    const generos = [...new Set(
      canciones.map(c => c.querySelector('genero')?.getAttribute('tipo') || '').filter(Boolean)
    )].sort();
    generos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      selGenero.appendChild(opt);
    });
  }


  /* Listener del filtro de género */
  selGenero.addEventListener('change', () => {
    const g = selGenero.value;
    const subset = g
      ? todasCanciones.filter(c => c.querySelector('genero')?.getAttribute('tipo') === g)
      : todasCanciones;

    // Mostramos cuántas canciones aplican al filtro
    statsScope.textContent = g ? `Mostrando: ${g} (${subset.length} canciones)` : '';
    renderTodo(subset);
  });


  /*  Render completo */
  function renderTodo(canciones) {
    renderMetricas(canciones);
    renderGeneroBars(canciones);
    renderIdiomaBars(canciones);
    renderTopCanciones(canciones);
    renderArtistasBars(canciones);
  }


  /*  Métricas generales */
  function renderMetricas(canciones) {
    const grid   = document.getElementById('metricas-grid');
    const favs   = canciones.filter(c => txt(c, 'favorita') === 'true').length;
    const generos = new Set(
      canciones.map(c => c.querySelector('genero')?.getAttribute('tipo')).filter(Boolean)
    ).size;
    const stars   = canciones.map(c =>
      parseInt(c.querySelector('calificacion')?.getAttribute('estrellas') || '0')
    );
    const promEst = stars.length
      ? (stars.reduce((a, b) => a + b, 0) / stars.length).toFixed(1)
      : '—';
    const maxEst  = Math.max(...stars);

    const metricas = [
      { label: 'Total canciones',   value: canciones.length,          sub: 'en la biblioteca'   },
      { label: 'Artistas únicos',   value: artistasUnicos(canciones),  sub: 'representados'      },
      { label: 'Favoritas',         value: favs,                       sub: `${Math.round(favs / canciones.length * 100) || 0}% del total` },
      { label: 'Géneros',           value: generos,                    sub: 'estilos musicales'  },
      { label: 'Calificación prom', value: promEst,                    sub: 'sobre 5 estrellas'  },
      { label: 'Calificación max',  value: maxEst + '★',               sub: 'puntuación más alta'}
    ];

    grid.innerHTML = metricas.map(m => `
      <div class="stat-detail-card">
        <div class="stat-detail-label">${m.label}</div>
        <div class="stat-detail-value">${m.value}</div>
        <div class="stat-detail-sub">${m.sub}</div>
      </div>`
    ).join('');
  }


  /* Función genérica para renderizar barras*/
  function renderBars(contenedorId, datos, max) {
    const contenedor = document.getElementById(contenedorId);
    contenedor.innerHTML = datos.map(([label, count]) => {
      const pct = Math.round((count / max) * 100);
      return `
        <div class="genre-row">
          <span class="genre-name" title="${label}">
            ${label.length > 18 ? label.slice(0, 18) + '…' : label}
          </span>
          <div class="genre-track">
            <div class="genre-fill" style="width:0" data-pct="${pct}"></div>
          </div>
          <span class="genre-count">${count}</span>
        </div>`;
    }).join('');

    // Animamos las barras con un pequeño retraso para que se vea la transición
    setTimeout(() => {
      contenedor.querySelectorAll('.genre-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    }, 80);
  }

  function renderGeneroBars(canciones) {
    const datos = contarPorGenero(canciones);
    renderBars('genre-bars-stats', datos, datos[0]?.[1] || 1);
  }

  function renderIdiomaBars(canciones) {
    const mapa = {};
    canciones.forEach(c => {
      const id = txt(c, 'idioma') || 'Sin idioma';
      mapa[id] = (mapa[id] || 0) + 1;
    });
    const datos = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    renderBars('idioma-bars', datos, datos[0]?.[1] || 1);
  }

  function renderArtistasBars(canciones) {
    const mapa = {};
    canciones.forEach(c => {
      const a = txt(c, 'nombre') || 'Desconocido';
      mapa[a] = (mapa[a] || 0) + 1;
    });
    // Solo los 8 artistas con más canciones
    const datos = Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 8);
    renderBars('artistas-bars', datos, datos[0]?.[1] || 1);
  }


  /* Top 8 canciones mejor calificadas */
  function renderTopCanciones(canciones) {
    const lista = document.getElementById('top-canciones');
    const top = [...canciones]
      .sort((a, b) => {
        const sA = parseInt(a.querySelector('calificacion')?.getAttribute('estrellas') || '0');
        const sB = parseInt(b.querySelector('calificacion')?.getAttribute('estrellas') || '0');
        return sB - sA;
      })
      .slice(0, 8);

    lista.innerHTML = top.map((c, i) => {
      const tipo    = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
      const stars   = c.querySelector('calificacion')?.getAttribute('estrellas') || '0';
      const esFav   = txt(c, 'favorita') === 'true';
      const portada = txt(c, 'portada');
      return `
        <li class="song-item song-item--stats">
          <span class="song-num">${i + 1}</span>
          <div class="song-thumb">
            <img src="${portada}" onerror="this.src='${GENRE_ICONS[tipo] || GENRE_ICONS.Otro}'">
          </div>
          <div class="song-info">
            <div class="song-title">${txt(c, 'titulo')}</div>
            <div class="song-artist">${txt(c, 'nombre')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem">
            ${esFav ? '<span class="fav-badge">♥</span>' : ''}
            <span class="stars">${estrellas(stars)}</span>
          </div>
        </li>`;
    }).join('');
  }

});