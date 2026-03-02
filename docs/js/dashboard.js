//Init firebase
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

//Verify user
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Usuario:", user.email);

        document.querySelector('h1').textContent =
            "Dashboard de " + user.email;

    } else {
        window.location.href = 'index.html';
    }
});

//LogOut
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
});

const toggles = document.querySelectorAll(".toggle-details");

toggles.forEach(btn => {
    btn.addEventListener("click", () => {
        const details = btn.closest(".weatherStation").querySelector(".station-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        btn.textContent = details.style.display === "block" ? "Detalles ▴" : "Detalles ▾";
    });
});