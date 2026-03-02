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

//See details
document.getElementById('addStationBtn').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.add('open');
});

document.getElementById('cancelBtn').addEventListener('click', closeModal);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('wuStationId').value    = '';
    document.getElementById('stationName').value    = '';
    document.getElementById('stationLocation').value= '';
    document.getElementById('wuApiKey').value       = '';
    document.getElementById('stationPhoto').value   = '';
    document.getElementById('modalMsg').className   = 'message';
}

function showModalMsg(text, type = 'error') {
    const el = document.getElementById('modalMsg');
    el.textContent = text;
    el.className = 'message ' + type;
}

//Build Card
function buildCard(stationId, station, adopted) {
    const div = document.createElement('div');
    div.className = 'weatherStation card';
    div.dataset.stationId = stationId;

    const imgHTML = station.photoURL
        ? `<img src="${station.photoURL}" alt="${station.name}">`
        : `<img src="" alt="" style="background:#E0E0E0;">`;

    const createdAt = station.createdAt
        ? new Date(station.createdAt.toMillis()).toLocaleDateString('es-AR')
        : '—';

    const esPropia = station.registeredBy === currentUser.uid;

    div.innerHTML = `
        <div class="station-header">
            ${imgHTML}
            <div class="station-info">
                <h2>${adopted.nickname || station.name}</h2>
                <div class="status">
                    <span class="status-dot"></span>
                    <span class="status-text">Sin datos aún</span>
                </div>
            </div>
            <button class="toggle-details">Detalles ▾</button>
        </div>
        <div class="station-details">
            <p><strong>ID WU:</strong> ${station.wuStationId}</p>
            <p><strong>Ubicación:</strong> ${station.location || '—'}</p>
            <p><strong>Registrada el:</strong> ${createdAt}</p>
            <p><strong>API Key:</strong> ${station.apiKey ? '✓ Configurada' : 'No configurada (usará la global)'}</p>
            ${esPropia ? `<p><strong>Rol:</strong> Propietario</p>` : `<p><strong>Rol:</strong> Adoptada</p>`}
        </div>`;

    return div;
}

// ── Toggle detalles ──────────────────────────────────────────

function bindToggles() {
    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const details = btn.closest('.weatherStation').querySelector('.station-details');
            const open = details.style.display === 'block';
            details.style.display = open ? 'none' : 'block';
            btn.textContent = open ? 'Detalles ▾' : 'Detalles ▴';
        });
    });
}

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
async function loadStations(uid) {
    const list = document.getElementById('stationList');
    list.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">Cargando...</p>';

    const adoptedSnap = await db.collection('users').doc(uid)
        .collection('adoptedStations').get();

    if (adoptedSnap.empty) {
        list.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">No tenés estaciones todavía. ¡Agregá la primera!</p>';
        return;
    }

    list.innerHTML = '';

    for (const doc of adoptedSnap.docs) {
        const stationDoc = await db.collection('stations').doc(doc.id).get();
        if (!stationDoc.exists) continue;

        const station = stationDoc.data();
        const adopted = doc.data();
        list.appendChild(buildCard(doc.id, station, adopted));
    }

    bindToggles();
}

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