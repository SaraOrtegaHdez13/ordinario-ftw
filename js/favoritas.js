/**
 * favoritas.js — Lógica de la página de favoritas
 * Muestra las canciones marcadas como favorita=true,
 * permite filtrar por texto, género y calificación,
 * y alternar entre vista de tarjetas y lista.
 */

document.addEventListener('DOMContentLoaded', () => {
  const { cargarXML, mostrarErrorCarga,
          txt, estrellas, GENRE_ICONS } = window.CS;

  let todasFavoritas = [];
  let vistaActual    = 'cards';

  const inputBuscar = document.getElementById('buscar-fav');
  const selGenero   = document.getElementById('filtro-fav-genero');
  const selEst      = document.getElementById('filtro-fav-estrellas');
  const selVista    = document.getElementById('vista-fav');
  const contador    = document.getElementById('fav-count');
  const contenedor  = document.getElementById('contenedor-favoritas');

  /* Carga  */
  cargarXML()
    .then(({ canciones }) => {
      todasFavoritas = canciones.filter(c => txt(c, 'favorita') === 'true');
      poblarGeneros(todasFavoritas);
      renderFavoritas(todasFavoritas);
    })
    .catch(mostrarErrorCarga);

  /* Desplegable de géneros  */
  function poblarGeneros(favs) {
    const generos = [...new Set(
      favs.map(c => c.querySelector('genero')?.getAttribute('tipo') || '').filter(Boolean)
    )].sort();
    generos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      selGenero.appendChild(opt);
    });
  }

  /* Filtros  */
  [inputBuscar, selGenero, selEst].forEach(el =>
    el.addEventListener('input', aplicarFiltros)
  );

  selVista.addEventListener('change', () => {
    vistaActual = selVista.value;
    aplicarFiltros();
  });

  function aplicarFiltros() {
    const busq   = inputBuscar.value.trim().toLowerCase();
    const genero = selGenero.value;
    const minEst = parseInt(selEst.value) || 0;

    const filtradas = todasFavoritas.filter(c => {
      const titulo  = txt(c, 'titulo').toLowerCase();
      const artista = txt(c, 'nombre').toLowerCase();
      const genC    = c.querySelector('genero')?.getAttribute('tipo') || '';
      const estC    = parseInt(c.querySelector('calificacion')?.getAttribute('estrellas') || '0');

      if (busq   && !titulo.includes(busq) && !artista.includes(busq)) return false;
      if (genero && genC !== genero) return false;
      if (minEst && estC < minEst) return false;
      return true;
    });

    renderFavoritas(filtradas);
  }

  /* Render  */
  function renderFavoritas(favs) {
    const n = favs.length;
    contador.textContent = `${n} favorita${n !== 1 ? 's' : ''}`;

    if (!n) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <img src="resources/heart.svg" class="empty-state-icon">
          <p>No hay favoritas con esos criterios.</p>
        </div>`;
      return;
    }

    contenedor.innerHTML = vistaActual === 'cards'
      ? renderCards(favs)
      : renderLista(favs);
  }

  /* Vista tarjetas  */
  function renderCards(favs) {
    return `<div class="cards-grid">` +
      favs.map(c => {
        const tipo    = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
        const stars   = c.querySelector('calificacion')?.getAttribute('estrellas') || '0';
        const portada = txt(c, 'portada');
        return `
          <article class="fav-card fade-in">
            <div class="fav-card-thumb">
              <img src="${portada}"
                   onerror="this.src='${GENRE_ICONS[tipo] || GENRE_ICONS.Balada}'">
            </div>
            <div class="fav-card-title">${txt(c, 'titulo')}</div>
            <div class="fav-card-artist">${txt(c, 'nombre')}</div>
            <div class="fav-card-meta">
              <span class="fav-card-genre">${tipo}</span>
              <span class="fav-card-stars">${estrellas(stars)}</span>
            </div>
          </article>`;
      }).join('') + `</div>`;
  }

  /* Vista lista  */
  function renderLista(favs) {
    return `
      <div class="table-wrap">
        <table class="catalogo-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Portada</th>
              <th scope="col">Título</th>
              <th scope="col">Artista</th>
              <th scope="col">Género</th>
              <th scope="col">Duración</th>
              <th scope="col">Calificación</th>
            </tr>
          </thead>
          <tbody>
            ${favs.map((c, i) => {
              const tipo    = c.querySelector('genero')?.getAttribute('tipo') || 'Otro';
              const stars   = c.querySelector('calificacion')?.getAttribute('estrellas') || '0';
              const portada = txt(c, 'portada');
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>
                    <img src="${portada}" class="song-thumb-sm"
                         onerror="this.src='${GENRE_ICONS[tipo] || GENRE_ICONS.Balada}'">
                  </td>
                  <td>${txt(c, 'titulo')}</td>
                  <td>${txt(c, 'nombre')}</td>
                  <td><span class="badge-genero">${tipo}</span></td>
                  <td class="fav-duracion">${txt(c, 'duracion')}</td>
                  <td><span class="stars">${estrellas(stars)}</span></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }
});