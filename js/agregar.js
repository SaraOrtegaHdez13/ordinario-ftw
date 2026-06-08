/**
 * Valida todos los campos en tiempo real y al enviar,
 * genera una vista previa del fragmento XML resultante,
 * y simula el guardado mostrando confirmación.
 */

document.addEventListener('DOMContentLoaded', () => {

  /*Referencias */
  const form        = document.getElementById('form-cancion');
  const alertOk     = document.getElementById('alert-ok');
  const alertErr    = document.getElementById('alert-err');
  const alertErrMsg = document.getElementById('alert-err-msg');
  const xmlPreview  = document.getElementById('xml-preview');

  let nextId = 900;

  /* Reglas de validación */
  const reglas = {
    titulo:   { req: true, msg: 'El título es obligatorio.' },
    artista:  { req: true, msg: 'El artista es obligatorio.' },
    anio:     { req: true, msg: 'Ingresa un año válido (1900–2099).',
                fn: v => /^\d{4}$/.test(String(v).trim()) && +v >= 1900 && +v <= 2099 },
    duracion: { req: true, msg: 'Ingresa la duración en formato m:ss (ej. 3:45).',
                fn: v => /^\d{1,2}:\d{2}$/.test(v) },
    idioma:   { req: true, msg: 'Selecciona un idioma.' },
    genero:   { req: true, msg: 'Selecciona un género.' }
  };

  /* Validación individual  */
  function validarCampo(id) {
    const regla = reglas[id];
    if (!regla) return true;

    const campo = document.getElementById(id);
    const errEl = document.getElementById(id + '-err');
    const valor = campo.value.trim();

    let valido = true;
    if (regla.req && !valor)              valido = false;
    if (valido && regla.fn && !regla.fn(valor)) valido = false;

    campo.classList.toggle('error', !valido);
    if (errEl) errEl.classList.toggle('visible', !valido);
    return valido;
  }

  function validarEstrellas() {
    const sel   = form.querySelector('input[name="calificacion"]:checked');
    const errEl = document.getElementById('calificacion-err');
    const valido = !!sel;
    errEl.classList.toggle('visible', !valido);
    return valido;
  }

  function validarTodo() {
    const resultados = Object.keys(reglas).map(validarCampo);
    const estOk      = validarEstrellas();
    return resultados.every(Boolean) && estOk;
  }

  /* Preview XML en tiempo real */
  function generarXMLPreview() {
    const titulo    = document.getElementById('titulo').value.trim();
    const artista   = document.getElementById('artista').value.trim();
    const album     = document.getElementById('album').value.trim();
    const anio      = document.getElementById('anio').value.trim();
    const duracion  = document.getElementById('duracion').value.trim();
    const idioma    = document.getElementById('idioma').value;
    const genero    = document.getElementById('genero').value;
    const estrellas = form.querySelector('input[name="calificacion"]:checked')?.value || '';
    const favorita  = document.getElementById('favorita').checked ? 'true' : 'false';

    if (!titulo && !artista) {
      xmlPreview.textContent = '<!-- Completa el formulario para ver el XML generado -->';
      return;
    }

    const id  = `c${String(nextId).padStart(3, '0')}`;
    const xml =
`<cancion id="${id}">
  <titulo>${titulo || '...'}</titulo>
  <artista id="a001">
    <nombre>${artista || '...'}</nombre>
  </artista>
  ${album ? `<album>${album}</album>\n  ` : ''}<anio>${anio || '...'}</anio>
  <duracion>${duracion || '...'}</duracion>
  <idioma>${idioma || '...'}</idioma>
  <genero tipo="${genero || '...'}"/>
  <calificacion estrellas="${estrellas || '0'}"/>
  <favorita>${favorita}</favorita>
</cancion>`;

    xmlPreview.textContent = xml;
  }

  /* Listeners para preview en tiempo real */
  ['titulo', 'artista', 'album', 'anio', 'duracion', 'idioma', 'genero', 'favorita']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', generarXMLPreview);
    });

  form.querySelectorAll('input[name="calificacion"]').forEach(radio => {
    radio.addEventListener('change', generarXMLPreview);
  });

  /* Validación en blur */
  Object.keys(reglas).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validarCampo(id));
  });

  /* Submit  */
  form.addEventListener('submit', e => {
    e.preventDefault();
    alertOk.classList.remove('visible');
    alertErr.classList.remove('visible');

    if (!validarTodo()) {
      alertErrMsg.textContent = 'Por favor corrige los errores antes de continuar.';
      alertErr.classList.add('visible');
      form.querySelector('.form-input.error, .form-select.error')?.focus();
      return;
    }

    guardarCancionEnSesion();
    alertOk.classList.add('visible');
    nextId++;
    alertOk.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      form.reset();
      xmlPreview.textContent = '<!-- Completa el formulario para ver el XML generado -->';
    }, 2000);
  });

  /* Guardar en sesión  */
  function guardarCancionEnSesion() {
    const cancion = {
      id:       `c${String(nextId).padStart(3, '0')}`,
      titulo:   document.getElementById('titulo').value.trim(),
      artista:  document.getElementById('artista').value.trim(),
      album:    document.getElementById('album').value.trim(),
      anio:     document.getElementById('anio').value.trim(),
      duracion: document.getElementById('duracion').value.trim(),
      idioma:   document.getElementById('idioma').value,
      genero:   document.getElementById('genero').value,
      estrellas:form.querySelector('input[name="calificacion"]:checked')?.value || '0',
      favorita: document.getElementById('favorita').checked ? 'true' : 'false'
    };

    let canciones = [];
    try { canciones = JSON.parse(sessionStorage.getItem('canciones_nuevas') || '[]'); } catch (_) {}
    canciones.push(cancion);
    try { sessionStorage.setItem('canciones_nuevas', JSON.stringify(canciones)); } catch (_) {}
  }

  /* Reset manual */
  document.getElementById('btn-reset').addEventListener('click', () => {
    setTimeout(() => {
      form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      form.querySelectorAll('.form-error.visible').forEach(el => el.classList.remove('visible'));
      alertOk.classList.remove('visible');
      alertErr.classList.remove('visible');
      xmlPreview.textContent = '<!-- Completa el formulario para ver el XML generado -->';
    }, 0);
  });
});