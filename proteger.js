import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

onAuthStateChanged(auth, (usuario) => {
    if (!usuario) {
        // Nadie ha iniciado sesión: lo mandamos de regreso al login
        window.location.href = 'sesion.html';
    }
});

// Puedes usar esta función en un botón de "Cerrar sesión" si más adelante agregas uno:
// import { cerrarSesion } from './proteger.js';
export function cerrarSesion() {
    signOut(auth).then(() => {
        window.location.href = 'sesion.html';
    });
}
