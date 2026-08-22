import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    collection, addDoc, doc, getDoc, updateDoc,
    onSnapshot, query, where, orderBy, serverTimestamp,
    arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* =========================================================
   USUARIO ACTUAL
   ========================================================= */
let usuarioActual = null;
let nombreUsuarioActual = 'Papu';

onAuthStateChanged(auth, async (user) => {
    usuarioActual = user;
    if (user) {
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) {
                nombreUsuarioActual = snap.data().usuario || snap.data().nombre || 'Papu';
            }
        } catch (err) {
            console.error('No se pudo leer el perfil del usuario:', err);
        }
    }
});

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
   PUBLICACIONES COMPARTIDAS (Firestore + Storage)
   ========================================================= */
const SECCIONES_CON_POSTS = ['cocina', 'anime', 'artistas'];
const coleccionPosts = collection(db, 'publicaciones');

function formatearFecha(timestamp) {
    if (!timestamp) return 'enviando...';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
        ' · ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function crearElementoPost(post, permiteCorazon) {
    const div = document.createElement('div');
    div.className = 'post';
    div.dataset.id = post.id;

    const corazones = post.corazones || [];
    const yaLeDiCorazon = usuarioActual && corazones.includes(usuarioActual.uid);

    let html = `<p class="post-autor">${post.autorNombre || 'Papu'}</p>`;

    if (post.imagen) {
        html += `<img src="${post.imagen}" class="post-imagen" alt="publicación" loading="lazy">`;
    }

    if (post.texto) {
        html += `<p class="post-texto"></p>`;
    }

    html += `<p class="post-fecha">${formatearFecha(post.fecha)}</p>`;

    html += `<div class="post-acciones">`;
    if (permiteCorazon) {
        html += `
            <button class="btn-corazon ${yaLeDiCorazon ? 'activo' : ''}">
                ${yaLeDiCorazon ? '❤️' : '🤍'} <span class="conteo">${corazones.length}</span>
            </button>`;
    }
    html += `<button class="btn-toggle-comentarios">💬 comentarios</button>`;
    html += `</div>`;

    html += `<div class="zona-comentarios">
        <div class="lista-comentarios"></div>
        <div class="form-comentario">
            <input type="text" class="input-comentario" placeholder="Escribe un comentario...">
            <button class="btn-enviar-comentario">Enviar</button>
        </div>
    </div>`;

    div.innerHTML = html;

    if (post.texto) {
        div.querySelector('.post-texto').textContent = post.texto;
    }

    // Corazón
    if (permiteCorazon) {
        const btnCorazon = div.querySelector('.btn-corazon');
        btnCorazon.addEventListener('click', async () => {
            if (!usuarioActual) return;
            const postRef = doc(db, 'publicaciones', post.id);
            try {
                if (yaLeDiCorazon) {
                    await updateDoc(postRef, { corazones: arrayRemove(usuarioActual.uid) });
                } else {
                    await updateDoc(postRef, { corazones: arrayUnion(usuarioActual.uid) });
                }
            } catch (err) {
                console.error('Error al reaccionar:', err);
            }
        });
    }

    // Comentarios: escuchamos en tiempo real desde que se crea la tarjeta
    const listaComentarios = div.querySelector('.lista-comentarios');
    const btnToggle = div.querySelector('.btn-toggle-comentarios');
    const zonaComentarios = div.querySelector('.zona-comentarios');

    const qComentarios = query(
        collection(db, 'publicaciones', post.id, 'comentarios'),
        orderBy('fecha', 'asc')
    );

    onSnapshot(qComentarios, (snap) => {
        listaComentarios.innerHTML = '';
        snap.forEach((c) => {
            const dato = c.data();
            const p = document.createElement('p');
            p.className = 'comentario';
            const strong = document.createElement('strong');
            strong.textContent = (dato.autorNombre || 'Papu') + ': ';
            p.appendChild(strong);
            p.appendChild(document.createTextNode(dato.texto));
            listaComentarios.appendChild(p);
        });
        btnToggle.textContent = `💬 ${snap.size} comentario${snap.size === 1 ? '' : 's'}`;
    });

    btnToggle.addEventListener('click', () => {
        zonaComentarios.classList.toggle('visible');
    });

    const inputComentario = div.querySelector('.input-comentario');
    const btnEnviarComentario = div.querySelector('.btn-enviar-comentario');

    async function enviarComentario() {
        const texto = inputComentario.value.trim();
        if (!texto || !usuarioActual) return;

        inputComentario.value = '';
        try {
            await addDoc(collection(db, 'publicaciones', post.id, 'comentarios'), {
                texto: texto,
                autorUID: usuarioActual.uid,
                autorNombre: nombreUsuarioActual,
                fecha: serverTimestamp()
            });
        } catch (err) {
            console.error('Error al comentar:', err);
        }
    }

    btnEnviarComentario.addEventListener('click', enviarComentario);
    inputComentario.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') enviarComentario();
    });

    return div;
}

function escucharFeed(seccion) {
    const feed = document.querySelector(`#seccion-${seccion} .feed`);
    const permiteCorazon = document.getElementById('seccion-' + seccion).dataset.corazon === 'si';

    const q = query(
        coleccionPosts,
        where('seccion', '==', seccion),
        orderBy('fecha', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        feed.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const post = { id: docSnap.id, ...docSnap.data() };
            feed.appendChild(crearElementoPost(post, permiteCorazon));
        });
    }, (error) => {
        console.error(`Error escuchando la sección ${seccion}:`, error);
        feed.innerHTML = '<p style="color:#f87171; text-align:center;">No se pudieron cargar las publicaciones. Revisa la consola (F12).</p>';
    });
}

/* Comprime y redimensiona la imagen antes de guardarla como base64,
   para que quepa dentro del límite de 1MB por documento de Firestore */
function comprimirImagen(archivo, maxDimension = 900, calidad = 0.7) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round(height * (maxDimension / width));
                        width = maxDimension;
                    } else {
                        width = Math.round(width * (maxDimension / height));
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
    });
}

function inicializarCreacionPost(seccion) {
    const contenedor = document.getElementById('seccion-' + seccion);
    const inputPost = contenedor.querySelector('.input-post');
    const inputImagen = contenedor.querySelector('.input-imagen');
    const previewImagen = contenedor.querySelector('.preview-imagen');
    const btnEnviarPost = contenedor.querySelector('.btn-enviar-post');

    let imagenBase64 = null;

    inputImagen.addEventListener('change', async () => {
        const archivo = inputImagen.files[0];
        if (!archivo) return;

        try {
            imagenBase64 = await comprimirImagen(archivo);
            previewImagen.src = imagenBase64;
            previewImagen.hidden = false;
        } catch (err) {
            console.error('Error procesando la imagen:', err);
        }
    });

    btnEnviarPost.addEventListener('click', async () => {
        const texto = inputPost.value.trim();
        if (!texto && !imagenBase64) return;
        if (!usuarioActual) return;

        btnEnviarPost.disabled = true;
        btnEnviarPost.textContent = '⏳';

        try {
            await addDoc(coleccionPosts, {
                seccion: seccion,
                texto: texto,
                imagen: imagenBase64,
                autorUID: usuarioActual.uid,
                autorNombre: nombreUsuarioActual,
                corazones: [],
                fecha: serverTimestamp()
            });

            inputPost.value = '';
            inputImagen.value = '';
            imagenBase64 = null;
            previewImagen.hidden = true;

        } catch (err) {
            console.error('Error al publicar:', err);
            alert('No se pudo publicar. Revisa la consola (F12) para más detalles.');
        }

        btnEnviarPost.disabled = false;
        btnEnviarPost.textContent = '➤';
    });
}

SECCIONES_CON_POSTS.forEach((seccion) => {
    inicializarCreacionPost(seccion);
    escucharFeed(seccion);
});

/* =========================================================
   MÚSICA — sigue sonando aunque cambies de sección
   (esto se queda local, no compartido entre usuarios)
   ========================================================= */
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
