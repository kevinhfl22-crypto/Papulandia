import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const form = document.querySelector('.login-card');
const inputEmail = document.querySelector('input[name="email"]');
const inputPassword = document.querySelector('input[name="password"]');

const mensaje = document.createElement('p');
mensaje.style.textAlign = 'center';
mensaje.style.fontSize = '13px';
mensaje.style.marginTop = '14px';
form.appendChild(mensaje);

function mostrarMensaje(texto, esError) {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? '#f87171' : '#4ade80';
}

function traducirError(codigo) {
    switch (codigo) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Correo o contraseña incorrectos.';
        case 'auth/invalid-email':
            return 'El correo no es válido.';
        default:
            return 'Ocurrió un error, intenta de nuevo.';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarMensaje('Entrando...', false);

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        mostrarMensaje('¡Bienvenido de nuevo! Redirigiendo...', false);
        setTimeout(() => {
            window.location.href = 'papulandia.html';
        }, 1000);
    } catch (error) {
        mostrarMensaje(traducirError(error.code), true);
    }
});
