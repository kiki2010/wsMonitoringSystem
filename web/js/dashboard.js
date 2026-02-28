const toggles = document.querySelectorAll(".toggle-details");

toggles.forEach(btn => {
    btn.addEventListener("click", () => {
        const details = btn.closest(".weatherStation").querySelector(".station-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        btn.textContent = details.style.display === "block" ? "Detalles ▴" : "Detalles ▾";
    });
});

const firebaseConfig = {
    apiKey: "AIzaSyCn0FN06svJ4sY5hslkh4uHfYc7CcMk9Ss",
    authDomain: "wsmultirisk.firebaseapp.com",
    projectId: "wsmultirisk",
    storageBucket: "wsmultirisk.firebasestorage.app",
    messagingSenderId: "1062866362715",
    appId: "1:1062866362715:web:f23a95d4b14ae0d3f1ba7e",
    measurementId: "G-CDCRYBK5T2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('Usuario Registrado', userCredential.user);
        })
        .catch(error => {
            console.error('Error:', error.message);
        });
});