const { trim, reject } = require("lodash");
const { promises } = require("node:dns");

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
const db   = firebase.firestore()

//Verify user
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;

    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? userDoc.data() : {};
    const nombre = profile.displayName || profile.username || user.email;
    document.getElementById('dashTitle').textContent = 'Dashboard de ' + nombre;

    loadStations(user.uid);
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

//Save station
document.getElementById('saveStationBtn').addEventListener('click', async() => {
    const wuId = document.getElementById('wuStationId').value.trim().toUpperCase();
    const name = document.getElementById('stationName').value.trim();
    const location = document.getElementById('stationLocation').value.trim();
    const apiKey = document.getElementById('wuApiKey').value.trim();
    const photoFile = document.getElementById('stationPhoto').files[0];

    if (!wuId) { showModalMsg('ID es Obligatorio'); return; }
    if (!name) { showModalMsg('Nombre es Obligatorio'); return; }

    const btn = document.getElementById('saveStationBtn');
    btn.disabled = true;
    btn.textContent = 'SAVING...';

    try {
        let photoBase64 = '';
        if (photoFile) {
            photoBase64 = await resizeImageToBase64(photoFile, 400);
        }

        const existing = await db.collection('stations').doc(wuId).get();

        if (existing.exists) {
            await db.collection('users').doc(updateCurrentUser.uid)
                .collection('adoptedStations').doc(wuId).set({
                    wuStationId: wuId,
                    name: name,
                    location: location,
                    apiKey: apiKey,
                    photoURL: photoBase64,
                    registeredId: currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                await db.collection('users').doc(currentUser.uid)
                    .collection('adoptedStations').doc(wuId).set({
                        nickname:  name,
                        adoptedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                showModalMsg('¡Estación registrada!', 'success');
        }

        setTimeout(() => {
            closeModal();
            loadStations(currentUser.uid);
        }, 1200);

    } catch (err) {
        showModalMsg('error', err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Estación';
    }
});

//Load Stations

//ResizeImagetoBase64
function resizeImageToBase64(file, maxSize=400) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) {if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize;}}
                else {if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize;}}
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('error leyendo img'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Error al leer archivo'));
        reader.readAsDataURL(file);
    });
}