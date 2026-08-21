console.log('✅ registro.js se está ejecutando');

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

console.log('✅ imports de Firebase cargados correctamente');

const form = document.querySelector('.login-card');

if (!form) {
    console.error('❌ No se encontró ningún elemento con la clase .login-card. Revisa que tu <form> tenga class="login-card"');
}

const inputNombre = document.querySelector('input[name="name"]');
const inputUsuario = document.querySelector('input[name="usuario"]');
const inputEmail = document.querySelector('input[name="email"]');
const inputFecha = document.querySelector('input[name="date"]');
const inputPassword = document.querySelector('input[name="password"]');

console.log('Campos encontrados:', {
    form: !!form,
    nombre: !!inputNombre,
    usuario: !!inputUsuario,
    email: !!inputEmail,
    fecha: !!inputFecha,
    password: !!inputPassword
});

// Mensaje de error/éxito debajo del formulario
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
        case 'auth/email-already-in-use':
            return 'Ese correo ya tiene una cuenta registrada.';
        case 'auth/invalid-email':
            return 'El correo no es válido.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        default:
            return 'Ocurrió un error, intenta de nuevo.';
    }
}

form.addEventListener('submit', async (e) => {
    console.log('🖱️ Botón de crear cuenta presionado, interceptando el envío...');
    e.preventDefault();
    mostrarMensaje('Creando tu cuenta...', false);

    const nombre = inputNombre.value.trim();
    const usuario = inputUsuario.value.trim();
    const email = inputEmail.value.trim();
    const fecha = inputFecha.value;
    const password = inputPassword.value;

    try {
        const credencial = await createUserWithEmailAndPassword(auth, email, password);

        // Guardamos los datos extra (nombre, usuario, fecha) en Firestore
        await setDoc(doc(db, 'usuarios', credencial.user.uid), {
            nombre: nombre,
            usuario: usuario,
            email: email,
            fechaNacimiento: fecha,
            creadoEn: new Date().toISOString()
        });

        mostrarMensaje('¡Cuenta creada! Redirigiendo...', false);
        setTimeout(() => {
            window.location.href = 'papulandia.html';
        }, 1200);

    } catch (error) {
        mostrarMensaje(traducirError(error.code), true);
    }
});