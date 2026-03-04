// scripts/updateStations.js
// Corre cada 4 horas via GitHub Actions
// Lee estaciones de Firestore, llama a WU, guarda los datos

import admin from 'firebase-admin';
import fetch from 'node-fetch';

// ── Inicializar Firebase Admin ──────────────────────────────
// Las credenciales vienen de los secretos de GitHub

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// API key global de fallback (del secreto de GitHub)
const GLOBAL_API_KEY = process.env.WU_API_KEY;

// ── Función principal ───────────────────────────────────────

async function updateAllStations() {
    console.log('Iniciando actualización:', new Date().toISOString());

    // Leer todas las estaciones registradas
    const snapshot = await db.collection('stations').get();

    if (snapshot.empty) {
        console.log('No hay estaciones registradas.');
        return;
    }

    console.log(`Encontradas ${snapshot.size} estaciones.`);

    // Actualizar cada una
    const promises = snapshot.docs.map(doc => updateStation(doc));
    await Promise.allSettled(promises);

    console.log('Actualización completada.');
}

// ── Actualizar una estación ─────────────────────────────────

async function updateStation(doc) {
    const station = doc.data();
    const stationId = doc.id;

    // Usar la API key de la estación si tiene, sino la global
    const apiKey = station.apiKey || GLOBAL_API_KEY;

    if (!apiKey) {
        console.warn(`${stationId}: sin API key, saltando.`);
        return;
    }

    try {
        const url = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=m&apiKey=${apiKey}`;
        const res  = await fetch(url);

        if (!res.ok) {
            console.error(`${stationId}: error HTTP ${res.status}`);
            return;
        }

        const json = await res.json();

        if (!json.observations || json.observations.length === 0) {
            console.warn(`${stationId}: sin observaciones.`);
            // Marcar como offline
            await db.collection('stations').doc(stationId).update({
                lastData:    null,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                status:      'offline'
            });
            return;
        }

        const obs = json.observations[0];

        const lastData = {
            temp:      obs.metric?.temp        ?? null,  // °C
            humidity:  obs.humidity            ?? null,  // %
            windSpeed: obs.metric?.windSpeed   ?? null,  // km/h
            windDir:   obs.winddir             ?? null,  // grados
            pressure:  obs.metric?.pressure    ?? null,  // hPa
            precip:    obs.metric?.precipTotal ?? null,  // mm
            uv:        obs.uv                  ?? null,
        };

        await db.collection('stations').doc(stationId).update({
            lastData,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            status: 'online'
        });

        console.log(`${stationId}: actualizada ✓ (${lastData.temp}°C, ${lastData.humidity}%)`);

    } catch (err) {
        console.error(`${stationId}: error —`, err.message);
    }
}

// ── Correr ──────────────────────────────────────────────────

updateAllStations().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});