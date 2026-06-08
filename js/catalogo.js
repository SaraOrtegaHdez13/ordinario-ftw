/**
 * Renderiza la tabla completa y gestiona el filtrado
 * dinámico en tiempo real por título, artista, género,
 * idioma, calificación y estado de favorita.
 */

document.addEventListener('DOMContentLoaded', () => {
  const { cargarXML, mostrarErrorCarga,
          txt, estrellas, GENRE_ICONS } = window.CS;

  // Todas las canciones cargadas del XML
  let todasLasCanciones = [];

  // Referencias a los controles de filtro
  const inputBuscar  = document.getElementById('buscar');
  const selGenero    = document.getElementById('filtro-genero');
  const selIdioma    = document.getElementById('filtro-idioma');
  const selEstrellas = document.getElementById('filtro-estrellas');
  const selFavorita  = document.getElementById('filtro-favorita');
  const contadorEl   = document.getElementById('results-count');
  const tablaBody    = document.getElementById('tabla-body');


  /* Carga inicial*/
  cargarXML()
    .then(({ canciones }) => {
      todasLasCanciones = canciones;
      poblarSelects(canciones);
      renderTabla(canciones);
    })
    .catch(mostrarErrorCarga);


  /* Llenar los desplegables con valores únicos del XML */
  function poblarSelects(canciones) {

    // Géneros únicos ordenados alfabéticamente
    const generos = [...new Set(
      canciones.map(c => c.querySelector('genero')?.getAttribute('tipo') || '').filter(Boolean)
    )].sort();
    generos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      selGenero.appendChild(opt);
    });

    // Idiomas únicos ordenados alfabéticamente
    const idiomas = [...new Set(
      canciones.map(c => txt(c, 'idioma')).filter(Boolean)
    )].sort();
    idiomas.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      selIdioma.appendChild(opt);
    });
  }


  /* ── Listeners — se disparan al cambiar cualquier filtro */
  [inputBuscar, selGenero, selIdioma, selEstrellas, selFavorita]
    .forEach(el => el.addEventListener('input', aplicarFiltros));


  /* Filtrado dinámico */
  function aplicarFiltros() {
    const busq   = inputBuscar.value.trim().toLowerCase();
    const genero = selGenero.value;
    const idioma = selIdioma.value;
    const minEst = parseInt(selEstrellas.value) || 0;
    const esFav  = selFavorita.value;

    const filtradas = todasLasCanciones.filter(c => {
      const titulo  = txt(c, 'titulo').toLowerCase();
      const artista = txt(c, 'nombre').toLowerCase();
      const genC    = c.querySelector('genero')?.getAttribute('tipo') || '';
      const idiomaC = txt(c, 'idioma');
      const estC    = parseInt(c.querySelector('calificacion')?.getAttribute('estrellas') || '0');
      const favC    = txt(c, 'favorita');

      if (busq   && !titulo.includes(busq) && !artista.includes(busq)) return false;
      if (genero && genC !== genero)   return false;
      if (idioma && idiomaC !== idioma) return false;
      if (minEst && estC < minEst)     return false;
      if (esFav  && favC !== esFav)    return false;
      return true;
    });

    renderTabla(filtradas);
  }


  /* Renderizar filas de la tabla */
  function renderTabla(canciones) {

    // Actualizamos el contador de resultados
    const n = canciones.length;
    contadorEl.textContent = `${n} cancion${n !== 1 ? 'es' : ''}`;

    // Si no hay resultados mostramos mensaje con botón para limpiar
    if (!n) {
      tablaBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="10">
            No se encontraron canciones con esos criterios.
            <button class="btn btn-ghost btn-sm" id="btn-limpiar" style="margin-left:0.8rem">
              Limpiar filtros
            </button>
          </td>
        </tr>`;
      document.getElementById('btn-limpiar')
              ?.addEventListener('click', limpiarFiltros);
      return;
    }

    // Generamos una fila por cada canción
    tablaBody.innerHTML = canciones.map((c, i) => {
      const tipo   = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
      const stars  = c.querySelector('calificacion')?.getAttribute('estrellas') || '0';
      const esFav  = txt(c, 'favorita') === 'true';
      const album  = txt(c, 'album')    || '—';
      const idioma = txt(c, 'idioma')   || '—';
      const dur    = txt(c, 'duracion') || '—';
      const anio   = txt(c, 'anio')     || '—';
      const portada = txt(c, 'portada');

      return `
        <tr>
          <td>${i + 1}</td>
          <td>
            <div style="display:flex;align-items:center;gap:0.6rem">
              <img src="${portada}" class="song-thumb-sm"
                   onerror="this.src='${GENRE_ICONS[tipo] || GENRE_ICONS.Otro}'">
              ${txt(c, 'titulo')}
            </div>
          </td>
          <td>${txt(c, 'nombre')}</td>
          <td style="color:var(--text2)">${album}</td>
          <td><span class="badge-genero">${tipo}</span></td>
          <td style="color:var(--text2)">${idioma}</td>
          <td style="color:var(--text3);font-variant-numeric:tabular-nums">${dur}</td>
          <td style="color:var(--text3)">${anio}</td>
          <td>
            <span class="stars" aria-label="${stars} de 5 estrellas">
              ${estrellas(stars)}
            </span>
          </td>
          <td style="text-align:center">
            ${esFav
              ? '<span class="fav-icon" title="Favorita">♥</span>'
              : '<span style="color:var(--text3)">♡</span>'}
          </td>
        </tr>`;
    }).join('');
  }


  /* Limpiar todos los filtros */
  function limpiarFiltros() {
    inputBuscar.value  = '';
    selGenero.value    = '';
    selIdioma.value    = '';
    selEstrellas.value = '';
    selFavorita.value  = '';
    renderTabla(todasLasCanciones);
    inputBuscar.focus();
  }

});