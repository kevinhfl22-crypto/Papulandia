const elementos = document.querySelectorAll('.animar');

const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
        } else {
            entrada.target.classList.remove('visible');
        }
    });
}, {
    threshold: 0.15
});

elementos.forEach((el) => observador.observe(el));

const musica = document.getElementById('musica-fondo');
const btnMusica = document.getElementById('btn-musica');
let sonando = false;

btnMusica.addEventListener('click', () => {
    if (sonando) {
        musica.pause();
        btnMusica.textContent = '🔇';
    } else {
        musica.play();
        btnMusica.textContent = '🔊';
    }
    sonando = !sonando;
});

const linkSesion = document.querySelector('a[href*="sesion.html"]');
const linkCrearCuenta = document.querySelector('a[href*="crear%20cuenta.html"]');
let pausadaPorNavegacion = false;

function pausarMusica() {
    if (sonando) {
        musica.pause();
        btnMusica.textContent = '🔇';
        sonando = false;
        pausadaPorNavegacion = true;
    }
}

linkSesion.addEventListener('click', pausarMusica);
linkCrearCuenta.addEventListener('click', pausarMusica);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && pausadaPorNavegacion) {
        musica.play();
        btnMusica.textContent = '🔊';
        sonando = true;
        pausadaPorNavegacion = false;
    }
});