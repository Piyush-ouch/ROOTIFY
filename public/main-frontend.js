// main-frontend.js (Handles Login, Registration, and Auth State/Logout for index.html)

console.log('Main Frontend script loaded');

// Import necessary Firebase modules from firebase-init.js
import {
    auth,
    db,
    // doc, getDoc, setDoc, are now imported directly from CDN below
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from './firebase-init.js';

// NEW: Explicitly import doc, getDoc, and setDoc directly from Firestore CDN for robustness
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


// --- Login/Role Toggle ---
const userBtn = document.getElementById('show-user');
const adminBtn = document.getElementById('show-admin');
const userLoginForm = document.getElementById('user-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const registerForm = document.getElementById('register-form');

if (userBtn && adminBtn && userLoginForm && adminLoginForm && registerForm) {
    userBtn.addEventListener('click', () => {
        userBtn.classList.add('active');
        adminBtn.classList.remove('active');
        userLoginForm.style.display = '';
        adminLoginForm.style.display = 'none';
    });
    adminBtn.addEventListener('click', () => {
        adminBtn.classList.add('active');
        userBtn.classList.remove('active');
        adminLoginForm.style.display = '';
        userLoginForm.style.display = 'none';
    });
}


// --- Registration ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        const signupMessage = document.getElementById('signup-message');
        // Additional fields for admin
        let name = '';
        let phone = '';
        let region = '';
        if (role === 'admin') {
            name = document.getElementById('register-admin-name').value;
            phone = document.getElementById('register-admin-phone').value;
            region = document.getElementById('register-admin-region').value;
        }
        if (!email || !password || !role) {
            signupMessage.textContent = 'Please fill all fields.';
            signupMessage.style.color = 'orange';
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), { // Using the directly imported setDoc
                email: user.email,
                role,
                name: role === 'admin' ? name : '',
                phone_number: role === 'admin' ? phone : '',
                region: role === 'admin' ? region : ''
            });
            signupMessage.textContent = `Welcome, ${user.email}! Your account has been created.`;
            signupMessage.style.color = 'green';
        } catch (error) {
            let errorMessage = 'An error occurred during signup.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already in use. Try signing in or resetting your password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'The email address is not valid.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password sign up is disabled. Check your Firebase console.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'The password is too weak. Please choose a stronger password.';
                    break;
                default:
                    console.error('Signup error:', error.message);
                    break;
            }
            signupMessage.textContent = `Error: ${errorMessage}`;
            signupMessage.style.color = 'red';
        }
    });
}

// Add role change listener for admin fields
document.getElementById('register-role').addEventListener('change', function() {
    const role = this.value;
    if (role === 'admin') {
        document.getElementById('register-admin-name').style.display = 'block';
        document.getElementById('register-admin-phone').style.display = 'block';
        document.getElementById('register-admin-region').style.display = 'block';
    } else {
        document.getElementById('register-admin-name').style.display = 'none';
        document.getElementById('register-admin-phone').style.display = 'none';
        document.getElementById('register-admin-region').style.display = 'none';
    }
});

// --- User Login ---
if (userLoginForm) {
    userLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const loginMessage = document.getElementById('login-message');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const userDoc = await getDoc(doc(db, 'users', uid)); // Using the directly imported getDoc
            if (userDoc.exists() && userDoc.data().role === 'user') {
                window.location.href = 'user.html';
            } else {
                loginMessage.textContent = 'Not a user account.';
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            loginMessage.textContent = error.message;
            loginMessage.style.color = 'red';
        }
    });
}

// --- Admin Login ---
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const adminLoginMessage = document.getElementById('admin-login-message');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const userDoc = await getDoc(doc(db, 'users', uid)); // Using the directly imported getDoc
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                adminLoginMessage.textContent = 'Not an admin account.';
                adminLoginMessage.style.color = 'red';
            }
        } catch (error) {
            adminLoginMessage.textContent = error.message;
            adminLoginMessage.style.color = 'red';
        }
    });
}

// --- Google Login ---
const googleLoginButton = document.getElementById('google-login-button');
const googleLoginMessage = document.getElementById('google-login-message');
if (googleLoginButton) {
    const provider = new GoogleAuthProvider();
    googleLoginButton.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            // After successful Google login, check/set user role in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef); // Using the directly imported getDoc

            if (!userDocSnap.exists()) {
                // New Google user, set default 'user' role
                await setDoc(userDocRef, { // Using the directly imported setDoc
                    email: user.email,
                    role: 'user', // Default role for new Google sign-ups
                    name: user.displayName || '',
                    phone_number: '',
                    region: ''
                });
                console.log("New Google user registered with default 'user' role.");
                // Redirect user to user.html after default role set
                window.location.href = 'user.html';
            } else {
                // Existing Google user, check role and redirect
                const userData = userDocSnap.data();
                if (userData.role === 'user') {
                    window.location.href = 'user.html';
                } else if (userData.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    googleLoginMessage.textContent = 'User has an unrecognized role. Please contact support.';
                    googleLoginMessage.style.color = 'red';
                }
            }
            googleLoginMessage.textContent = `Signed in with Google: ${user.displayName || user.email}!`;
            googleLoginMessage.style.color = 'green';
        } catch (error) {
            let errorMessage = 'An error occurred during Google sign-in.';
            const errorCode = error.code;
            const email = error.customData ? error.customData.email : '';
            if (errorCode === 'auth/popup-closed-by-user') {
                errorMessage = 'Google sign-in cancelled.';
            } else if (errorCode === 'auth/cancelled-popup-request') {
                errorMessage = 'Another sign-in pop-up is already open.';
            } else if (errorCode === 'auth/account-exists-with-different-credential') {
                errorMessage = `An account with this email (${email}) already exists with different sign-in credentials.`;
            }
            googleLoginMessage.textContent = `Error: ${errorMessage}`;
            googleLoginMessage.style.color = 'red';
            console.error('Google sign-in error:', error);
        }
    });
}

// --- Auth State & Logout ---
const userStatusElement = document.getElementById('user-status');
const logoutButton = document.getElementById('logout-button');
const logoutMessage = document.getElementById('logout-message');

onAuthStateChanged(auth, (user) => {
    if (user) {
        userStatusElement.textContent = `Logged in as: ${user.email || user.displayName}`;
        if (logoutButton) logoutButton.style.display = 'block';
    } else {
        userStatusElement.textContent = 'Not logged in.';
        if (logoutButton) logoutButton.style.display = 'none';
    }
});
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            logoutMessage.textContent = 'You have been signed out.';
            logoutMessage.style.color = 'green';
            window.location.href = 'index.html'; // Redirect to index.html after logout
        } catch (error) {
            logoutMessage.textContent = `Error signing out: ${error.message}`;
            logoutMessage.style.color = 'red';
            console.error('Logout error:', error);
        }
    });
}