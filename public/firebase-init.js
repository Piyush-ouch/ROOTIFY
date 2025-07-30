// firebase-init.js (Centralized Firebase Initialization and Exports)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc, // Make sure 'doc' is exported
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZqYNeZMC_bWsGDDA19oLCYcWrcyG9fOg",
  authDomain: "soil-farming-agent-rootify.firebaseapp.com",
  projectId: "soil-farming-agent-rootify",
  storageBucket: "soil-farming-agent-rootify.appspot.com",
  messagingSenderId: "249682656724",
  appId: "1:249682656724:web:6a13faa1011dcdac0d6a41",
  measurementId: "G-M0L26CH3LQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Export all necessary Firebase modules
export {
    db,
    collection,
    addDoc,
    getDocs,
    doc, // Explicitly exported
    updateDoc,
    deleteDoc,
    query,
    where,
    auth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
};