//Start Firebase
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

//If auth state changed go to dashboard
auth.onAuthStateChanged(user => {
    if (user) window.location.href = 'dashboard.html';
});

//Tab change (Login / Register)
function switchTab(tab) {
    document.getElementById('panelLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('panelRegister').classList.toggle('active', tab === 'register');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');   
}

//Msg and error managing
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'message ' + type;
}

function firebaseError(code) {
    const map = {
        'auth/email-already-in-use': 'This email is already on use.',
        'auth/invalid-email': 'Invalid email.',
        'auth/weak-password': 'The password must be at least 6 characters long.',
        'auth/user-not-found': 'There is no account with that email.',
        'auth/wrong-password': 'Wrong password.',
        'auth/too-many-requests': 'Too many attempts. Try later.',
    };

    return map[code] || 'An error occurred. Please try again.';
}


//Register a new User
const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const btn = registerForm.querySelector('.btn-submit');

    btn.disabled = true;
    btn.textContent = 'Loading...'; 

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('User register', userCredential.user);
        })
        .catch(error => {
            console.error('Error:', error.message);
            showMsg('registerMsg', firebaseError(error.code), 'error');
            btn.disabled = false;
            btn.textContent = 'Register';
        });
});

//Login
const loginForm = document.getElementById('loginForm')

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = loginForm.querySelector('.btn-submit');

        btn.disabled = true;
        btn.textContent = 'Loading...'; 
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = 'dashboard.html';
            })
            .catch(error => {
                console.error('Error:', error.message);
                showMsg('loginMsg', firebaseError(error.code), 'error');
                btn.disabled = false;
                btn.textContent = 'Login';
            });
    });
}