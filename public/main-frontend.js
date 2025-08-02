// main-frontend.js (Handles Login, Registration, and Auth State/Logout for index.html)

console.log('Main Frontend script loaded');

// Import necessary Firebase modules from firebase-init.js
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from './firebase-init.js';

// Explicitly import doc, getDoc, and setDoc directly from Firestore CDN for robustness
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


// --- Login/Role Toggle ---
const userBtn = document.getElementById('show-user');
const adminBtn = document.getElementById('show-admin');
const userLoginForm = document.getElementById('user-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const registerForm = document.getElementById('register-form');

// Variable to store the intended role for Google Sign-In
let intendedGoogleSignInRole = 'user'; // Default to user

if (userBtn && adminBtn && userLoginForm && adminLoginForm && registerForm) {
    userBtn.addEventListener('click', () => {
        userBtn.classList.add('active');
        adminBtn.classList.remove('active');
        userLoginForm.style.display = '';
        adminLoginForm.style.display = 'none';
        intendedGoogleSignInRole = 'user'; // Set intended role to user
    });
    adminBtn.addEventListener('click', () => {
        adminBtn.classList.add('active');
        userBtn.classList.remove('active');
        adminLoginForm.style.display = '';
        userLoginForm.style.display = 'none';
        intendedGoogleSignInRole = 'admin'; // Set intended role to admin
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
            await setDoc(doc(db, 'users', user.uid), {
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
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists() && userDoc.data().role === 'user') {
                window.location.href = 'user.html';
            } else {
                loginMessage.textContent = 'Not a user account or invalid credentials.'; // More general message
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
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                adminLoginMessage.textContent = 'Not an admin account or invalid credentials.'; // More general message
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
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // New Google user: Assign role based on what was intended at the time of click
                await setDoc(userDocRef, {
                    email: user.email,
                    role: intendedGoogleSignInRole, // Use the stored intended role
                    name: user.displayName || '',
                    phone_number: '',
                    region: ''
                });
                console.log(`New Google user registered with '${intendedGoogleSignInRole}' role.`);
                // Redirect based on the assigned role
                if (intendedGoogleSignInRole === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                // Existing Google user: Check their stored role
                const userData = userDocSnap.data();

                // If existing user is an admin, always redirect to admin page
                if (userData.role === 'admin') {
                    window.location.href = 'admin.html';
                }
                // If existing user is a user, and they tried to log in as admin
                else if (userData.role === 'user' && intendedGoogleSignInRole === 'admin') {
                    // This is the specific scenario causing the issue for existing users
                    // They are a 'user' in Firestore but tried to sign in via the 'Admin' button.
                    googleLoginMessage.textContent = 'Your account is registered as a User. Please use the User login or contact support to change your role to Admin.';
                    googleLoginMessage.style.color = 'red';
                    // Optionally, sign them out to prevent them from being logged in as a 'user' unexpectedly
                    await signOut(auth);
                }
                // If existing user is a user, and they tried to log in as a user (or default case)
                else if (userData.role === 'user' && intendedGoogleSignInRole === 'user') {
                     window.location.href = 'user.html';
                }
                // Fallback for unrecognized roles
                else {
                    googleLoginMessage.textContent = 'User has an unrecognized role. Please contact support.';
                    googleLoginMessage.style.color = 'red';
                    await signOut(auth); // Sign out unrecognized roles
                }
            }
            // Clear message if successful, or if message was set in error handler above
            if (!googleLoginMessage.textContent.includes("Error:") && !googleLoginMessage.textContent.includes("account is registered")) {
                googleLoginMessage.textContent = `Signed in with Google: ${user.displayName || user.email}!`;
                googleLoginMessage.style.color = 'green';
            }
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