/**
 * Permire que el HTML cargue completamente antes de ejecutar algo. 
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * cargarUsuarios buscará en el XML, y regresará la lista de
     * usuarios que hay dentro
     * 
     * txt lee el texto de un nodo XML
     */
    const cargarUsuarios = window.CS.cargarUsuarios;
    const txt = window.CS.txt;

    /** Lista de nodos <usuario> cargados del XML */
    let usuarios = [];

    /* Mandamos a traer a los usuarios */
    cargarUsuarios().then(us => {
        usuarios = us;
    }).catch(err => {
        mostrarError('No se pudo cargar el XML de usuarios.');
    });

    /**
     * Referencias
     */

    /* Para cuando se hace clic en Ingresar" */
    const form = document.getElementById('form-login');
    /* Para mostrar el "cajón" donde va el mensaje de error */
    const alertErr = document.getElementById('alert-err');
    /* Para mostrar el mensaje de error al ingresar credenciales inválidas */
    const alertErrMsg = document.getElementById('alert-err-msg');

    /* Para mostrar el mensaje de error */
    function mostrarError(msg) {
        alertErrMsg.textContent = msg;
        alertErr.classList.add('visible');
    }

    /* ── Validación de campo vacío */
    function validarCampo(id) {

        /* Encontrar los elementos en el HTML */
        const campo = document.getElementById(id);
        const errEl = document.getElementById(id + '-err');
        /* Revisa si está vacío */
        const ok = campo.value.trim().length > 0;

        /* Muestra o esconde el error */
        campo.classList.toggle('error', !ok);
        errEl.classList.toggle('visible', !ok);
        return ok;
    }

    /* Usa la función de arriba de validar campo, si el usuario sale del campo sin escribir nada, ahí es
    donde entra en acción */
    document.getElementById('usuario').addEventListener('blur', () => validarCampo('usuario'));
    document.getElementById('password').addEventListener('blur', () => validarCampo('password'));

    /* ── Submit: validar contra XML */
    form.addEventListener('submit', e => {
        e.preventDefault();
        alertErr.classList.remove('visible');

        // Validar campos vacíos
        const okU = validarCampo('usuario');
        const okP = validarCampo('password');
        if (!okU || !okP) return;

        // Verificar que el XML ya cargó
        if (!usuarios.length) {
            mostrarError('El XML aún no ha cargado. Espera un momento e intenta de nuevo.');
            return;
        }

        /* Lee lo que el usuario ingresó y quita espacios en blanco innecesarios */
        const usuarioIngresado  = document.getElementById('usuario').value.trim();
        const passwordIngresado = document.getElementById('password').value.trim();

        /**
         * Se recorre la lista de usuarios uno por uno, y se regresa
         * el primero donde el nombre y contraseña coincidan con lo que escribió el 
         * usuario
         */
        const encontrado = usuarios.find(u => {
            const nombreXML   = txt(u, 'nombreUsuario');
            const passwordXML = txt(u, 'password');
            return nombreXML === usuarioIngresado && passwordXML === passwordIngresado;
        });

        /**
         * Si no encuentra nada, muestra el error, borra la contraseña y devuelve el cursor
         * en ese campo
         */
        if (!encontrado) {
            mostrarError('Usuario o contraseña incorrectos.');
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            return;
        }

        // Login exitoso
        const rol    = encontrado.getAttribute('rol');
        const nombre = txt(encontrado, 'nombreCompleto') || usuarioIngresado;

        // Guardar sesión básica
        sessionStorage.setItem('usuario_actual', JSON.stringify({
            id:     encontrado.getAttribute('id'),
            nombre,
            usuario: usuarioIngresado,
            rol
        }));

        // Redirigir
        window.location.href = 'index.html';

    });
});
