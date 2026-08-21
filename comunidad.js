/* =========================================================
   MENÚ HAMBURGUESA
   ========================================================= */
const btnMenu = document.getElementById('btn-menu');
const btnCerrarMenu = document.getElementById('btn-cerrar-menu');
const menuLateral = document.getElementById('menu-lateral');
const overlayMenu = document.getElementById('overlay-menu');

function abrirMenu() {
    menuLateral.classList.add('abierto');
    overlayMenu.classList.add('visible');
}

function cerrarMenu() {
    menuLateral.classList.remove('abierto');
    overlayMenu.classList.remove('visible');
}

btnMenu.addEventListener('click', abrirMenu);
btnCerrarMenu.addEventListener('click', cerrarMenu);
overlayMenu.addEventListener('click', cerrarMenu);

/* =========================================================
   CAMBIO DE SECCIÓN
   ========================================================= */
const botonesMenu = document.querySelectorAll('.menu-item');
const secciones = document.querySelectorAll('.seccion');

function mostrarSeccion(nombre) {
    secciones.forEach((sec) => sec.classList.remove('activa'));
    document.getElementById('seccion-' + nombre).classList.add('activa');

    botonesMenu.forEach((btn) => btn.classList.remove('activo'));
    document.querySelector(`.menu-item[data-seccion="${nombre}"]`).classList.add('activo');

    cerrarMenu();
}

botonesMenu.forEach((btn) => {
    btn.addEventListener('click', () => {
        mostrarSeccion(btn.dataset.seccion);
    });
});

/* =========================================================
   PUBLICACIONES (localStorage) — cocina, anime, artistas
   ========================================================= */
const SECCIONES_CON_POSTS = ['cocina', 'anime', 'artistas'];

function claveStorage(seccion) {
    return 'papulandia_posts_' + seccion;
}

function obtenerPosts(seccion) {
    const datos = localStorage.getItem(claveStorage(seccion));
    return datos ? JSON.parse(datos) : [];
}

function guardarPosts(seccion, posts) {
    localStorage.setItem(claveStorage(seccion), JSON.stringify(posts));
}

function formatearFecha(timestamp) {
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
        ' · ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function crearElementoPost(post, seccion, permiteCorazon) {
    const div = document.createElement('div');
    div.className = 'post';
    div.dataset.id = post.id;

    let html = '';

    if (post.imagen) {
        html += `<img src="${post.imagen}" class="post-imagen" alt="publicación">`;
    }

    if (post.texto) {
        html += `<p class="post-texto"></p>`;
    }

    html += `<p class="post-fecha">${formatearFecha(post.fecha)}</p>`;

    html += `<div class="post-acciones">`;
    if (permiteCorazon) {
        html += `
            <button class="btn-corazon ${post.corazon ? 'activo' : ''}">
                ${post.corazon ? '❤️' : '🤍'} <span class="conteo">${post.corazon ? 1 : 0}</span>
            </button>`;
    }
    html += `<button class="btn-toggle-comentarios">💬 ${post.comentarios.length} comentario${post.comentarios.length === 1 ? '' : 's'}</button>`;
    html += `</div>`;

    html += `<div class="zona-comentarios">
        <div class="lista-comentarios"></div>
        <div class="form-comentario">
            <input type="text" class="input-comentario" placeholder="Escribe un comentario...">
            <button class="btn-enviar-comentario">Enviar</button>
        </div>
    </div>`;

    div.innerHTML = html;

    // texto del post se inserta con textContent para evitar problemas con HTML/XSS
    if (post.texto) {
        div.querySelector('.post-texto').textContent = post.texto;
    }

    const listaComentarios = div.querySelector('.lista-comentarios');
    post.comentarios.forEach((c) => {
        const p = document.createElement('p');
        p.className = 'comentario';
        p.textContent = c;
        listaComentarios.appendChild(p);
    });

    // Corazón
    if (permiteCorazon) {
        const btnCorazon = div.querySelector('.btn-corazon');
        btnCorazon.addEventListener('click', () => {
            const posts = obtenerPosts(seccion);
            const p = posts.find((x) => x.id === post.id);
            p.corazon = !p.corazon;
            guardarPosts(seccion, posts);
            btnCorazon.classList.toggle('activo', p.corazon);
            btnCorazon.innerHTML = `${p.corazon ? '❤️' : '🤍'} <span class="conteo">${p.corazon ? 1 : 0}</span>`;
        });
    }

    // Mostrar/ocultar comentarios
    const btnToggle = div.querySelector('.btn-toggle-comentarios');
    const zonaComentarios = div.querySelector('.zona-comentarios');
    btnToggle.addEventListener('click', () => {
        zonaComentarios.classList.toggle('visible');
    });

    // Agregar comentario
    const inputComentario = div.querySelector('.input-comentario');
    const btnEnviarComentario = div.querySelector('.btn-enviar-comentario');

    function enviarComentario() {
        const texto = inputComentario.value.trim();
        if (!texto) return;

        const posts = obtenerPosts(seccion);
        const p = posts.find((x) => x.id === post.id);
        p.comentarios.push(texto);
        guardarPosts(seccion, posts);

        const nuevoComentario = document.createElement('p');
        nuevoComentario.className = 'comentario';
        nuevoComentario.textContent = texto;
        listaComentarios.appendChild(nuevoComentario);

        btnToggle.textContent = `💬 ${p.comentarios.length} comentario${p.comentarios.length === 1 ? '' : 's'}`;
        inputComentario.value = '';
    }

    btnEnviarComentario.addEventListener('click', enviarComentario);
    inputComentario.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') enviarComentario();
    });

    return div;
}

function renderizarFeed(seccion) {
    const feed = document.querySelector(`#seccion-${seccion} .feed`);
    const permiteCorazon = document.getElementById('seccion-' + seccion).dataset.corazon === 'si';
    feed.innerHTML = '';

    const posts = obtenerPosts(seccion).slice().reverse();
    posts.forEach((post) => {
        feed.appendChild(crearElementoPost(post, seccion, permiteCorazon));
    });
}

function inicializarCreacionPost(seccion) {
    const contenedor = document.getElementById('seccion-' + seccion);
    const inputPost = contenedor.querySelector('.input-post');
    const inputImagen = contenedor.querySelector('.input-imagen');
    const previewImagen = contenedor.querySelector('.preview-imagen');
    const btnEnviarPost = contenedor.querySelector('.btn-enviar-post');

    let imagenBase64 = null;

    inputImagen.addEventListener('change', () => {
        const archivo = inputImagen.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = () => {
            imagenBase64 = lector.result;
            previewImagen.src = imagenBase64;
            previewImagen.hidden = false;
        };
        lector.readAsDataURL(archivo);
    });

    btnEnviarPost.addEventListener('click', () => {
        const texto = inputPost.value.trim();

        if (!texto && !imagenBase64) return;

        const posts = obtenerPosts(seccion);
        posts.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            texto: texto,
            imagen: imagenBase64,
            corazon: false,
            comentarios: [],
            fecha: Date.now()
        });
        guardarPosts(seccion, posts);

        inputPost.value = '';
        inputImagen.value = '';
        imagenBase64 = null;
        previewImagen.hidden = true;

        renderizarFeed(seccion);
    });
}

SECCIONES_CON_POSTS.forEach((seccion) => {
    inicializarCreacionPost(seccion);
    renderizarFeed(seccion);
});

/* =========================================================
   MÚSICA — sigue sonando aunque cambies de sección
   ========================================================= */

// 👉 Agrega aquí tus canciones: nombre a mostrar + ruta del archivo en tu carpeta Musica
const CANCIONES = [
    { nombre: 'Pumped up kicks', archivo: 'Musica/pumped.mp3' },
    { nombre: 'My kind of woman', archivo: 'Musica/woman.mp3' },
    { nombre: 'Careless slowed', archivo: 'Musica/careless slowed.mp3' },
    { nombre: 'Carmín', archivo: 'Musica/Carmín.mp3' },
    { nombre: "Verte de cerca", archivo: "Musica/Verte de cerca.mp3"},
    { nombre: "Better in the Dark - Jordana y TV Girl", archivo: "Musica/Better in the Dark.mp3"},
    { nombre: "On The Floor - Jennifer Lopez, Pitbull", archivo: "Musica/On The Floor.mp3"},
    { nombre: "My boy - Billie Eilish", archivo: "Musica/my boy.mp3"},
    { nombre:"Dark Red - Steve Lacy", archivo: "Musica/dark red.mp3"},
    { nombre: "Dyer Lane - Ghost Mountain y Sematary", archivo: "Musica/dyer lane.mp3"}
    
];

const audio = document.getElementById('audio-musica');
const listaCanciones = document.querySelector('.lista-canciones');
const reproductorFlotante = document.getElementById('reproductor-flotante');
const rfNombre = reproductorFlotante.querySelector('.rf-nombre');
const rfPlayPause = document.getElementById('rf-play-pause');

let cancionActualIndex = null;

CANCIONES.forEach((cancion, index) => {
    const li = document.createElement('li');
    li.className = 'cancion';
    li.innerHTML = `
        <button class="btn-play-cancion">▶</button>
        <span class="cancion-nombre">${cancion.nombre}</span>
    `;

    li.querySelector('.btn-play-cancion').addEventListener('click', () => {
        reproducirCancion(index);
    });

    listaCanciones.appendChild(li);
});

function actualizarEstadoVisualCanciones() {
    document.querySelectorAll('.cancion').forEach((li, index) => {
        const btn = li.querySelector('.btn-play-cancion');
        const sonandoAhora = index === cancionActualIndex && !audio.paused;
        li.classList.toggle('sonando', index === cancionActualIndex);
        btn.textContent = sonandoAhora ? '⏸' : '▶';
    });
}

function reproducirCancion(index) {
    if (cancionActualIndex === index) {
        // misma canción: toggle play/pausa
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    } else {
        cancionActualIndex = index;
        audio.src = CANCIONES[index].archivo;
        audio.play();
    }

    rfNombre.textContent = CANCIONES[index].nombre;
    reproductorFlotante.hidden = false;
    actualizarEstadoVisualCanciones();
}

rfPlayPause.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

audio.addEventListener('play', () => {
    rfPlayPause.textContent = '⏸';
    actualizarEstadoVisualCanciones();
});

audio.addEventListener('pause', () => {
    rfPlayPause.textContent = '▶';
    actualizarEstadoVisualCanciones();
});