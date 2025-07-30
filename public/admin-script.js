// admin-script.js

// Import necessary Firebase modules from firebase-init.js (excluding Firestore functions we import directly below)
import {
    auth,
    db,
    collection,
    getDocs,
    updateDoc,
    query,
    where,
    onAuthStateChanged,
    signOut
} from './firebase-init.js';

// Explicitly import ALL necessary Firestore functions directly from Firestore CDN for robustness
import {
    addDoc,
    doc,
    getDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


// --- Authentication Logic ---
const adminNameDisplay = document.getElementById('admin-name');
const logoutButton = document.getElementById('logout-btn');

// Retrieve current admin's name and phone for data attribution
let currentAdminName = '';
let currentAdminPhone = '';
let currentAdminUID = ''; // To store the UID of the logged-in admin

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Admin logged in:", user.email);
        adminNameDisplay.textContent = user.displayName ? user.displayName + "!" : user.email + "!";
        logoutButton.style.display = 'block';
        currentAdminUID = user.uid; // Store the current user's UID

        // Fetch admin's name and phone from their user document
        try {
            const adminDoc = await getDoc(doc(db, 'users', user.uid)); // Using the directly imported getDoc
            if (adminDoc.exists()) {
                const adminData = adminDoc.data();
                currentAdminName = adminData.name || user.displayName || user.email; // Fallback to email if name isn't set
                currentAdminPhone = adminData.phone_number || 'N/A'; // Use 'N/A' if phone isn't set
                adminNameDisplay.textContent = `${currentAdminName}!`; // Update display with fetched name
            }
        } catch (error) {
            console.error("Error fetching admin details:", error);
        }
        // After successfully setting currentAdminUID, fetch their specific data
        if (currentAdminUID) {
            fetchSoilTypes();
            fetchDistributors();
        }
    } else {
        console.log("Admin logged out.");
        adminNameDisplay.textContent = "Admin!";
        logoutButton.style.display = 'none';
        window.location.href = 'index.html'; // Redirect to login page if not logged in
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("User successfully signed out.");
    }
    catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to log out. Please try again.");
    }
});

// --- Soil Type Management ---
const soilForm = document.getElementById('add-soil-form');
const soilList = document.getElementById('soil-list');

async function addSoilType(e) {
    e.preventDefault();
    const name = soilForm['soil-name'].value;
    const ph = parseFloat(soilForm['soil-ph'].value);
    const nutrients = soilForm['soil-nutrients'].value;
    const waterRetention = soilForm['soil-water-retention'].value;
    const recommendedCrops = soilForm['soil-recommended-crops'].value.split(',').map(crop => crop.trim());
    try {
        await addDoc(collection(db, 'soil_types'), { // Using the directly imported addDoc
            name,
            pH: ph,
            nutrients,
            waterRetention,
            recommendedCrops,
            addedByAdminName: currentAdminName,
            addedByAdminPhoneNumber: currentAdminPhone,
            addedByAdminUID: currentAdminUID, // Store the admin's UID
            createdAt: new Date()
        });
        console.log("Soil type added successfully!");
        soilForm.reset();
        fetchSoilTypes();
    } catch (error) {
        console.error("Error adding soil type:", error);
        alert("Failed to add soil type. Check console for details.");
    }
}

async function fetchSoilTypes() {
    soilList.innerHTML = '<li>Loading soil types...</li>';
    if (!currentAdminUID) { // Prevent fetching if admin UID is not set yet
        soilList.innerHTML = '<li>Please log in as an administrator to view your data.</li>';
        return;
    }
    try {
        // Query only documents added by the current admin
        const q = query(collection(db, 'soil_types'), where('addedByAdminUID', '==', currentAdminUID));
        const querySnapshot = await getDocs(q); // Using the directly imported getDocs
        
        if (querySnapshot.empty) {
            soilList.innerHTML = '<li>No soil types added by you yet.</li>';
            return;
        }
        soilList.innerHTML = '';
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const li = document.createElement('li');
            li.setAttribute('data-id', docSnap.id);
            li.innerHTML = `
                <strong>${data.name}</strong><br>
                pH: ${data.pH}<br>
                Nutrients: ${data.nutrients}<br>
                Water Retention: ${data.waterRetention}<br>
                Recommended Crops: ${data.recommendedCrops.join(', ')}<br>
                Added by: ${data.addedByAdminName || 'Unknown Admin'} (Contact: ${data.addedByAdminPhoneNumber || 'N/A'})
                <button class="delete-soil-btn">Delete</button>
            `;
            soilList.appendChild(li);
            // CORRECTED: Pass docSnap.id to deleteSoilType function
            li.querySelector('.delete-soil-btn').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete ${data.name}?`)) {
                    await deleteSoilType(docSnap.id); // <--- FIX IS HERE
                }
            });
        });
    } catch (error) {
        console.error("Error fetching soil types:", error);
        soilList.innerHTML = '<li>Error loading soil types.</li>';
    }
}

async function deleteSoilType(id) {
    try {
        await deleteDoc(doc(db, 'soil_types', id)); // Using the directly imported deleteDoc and doc
        console.log("Soil type deleted successfully!");
        fetchSoilTypes();
    } catch (error) {
        console.error("Error deleting soil type:", error);
        alert("Failed to delete soil type. Check console for details.");
    }
}

// --- Distributor Data Management ---
const distributorForm = document.getElementById('add-distributor-form');
const distributorList = document.getElementById('distributor-list');

async function addDistributor(e) {
    e.preventDefault();
    const name = distributorForm['distributor-name'].value;
    const contact = distributorForm['distributor-contact'].value;
    const location = distributorForm['distributor-location'].value;
    try {
        await addDoc(collection(db, 'distributors'), { // Using the directly imported addDoc
            name,
            contact,
            location,
            addedByAdminName: currentAdminName,
            addedByAdminPhoneNumber: currentAdminPhone,
            addedByAdminUID: currentAdminUID, // Store the admin's UID
            createdAt: new Date()
        });
        console.log("Distributor added successfully!");
        distributorForm.reset();
        fetchDistributors();
    } catch (error) {
        console.error("Error adding distributor:", error);
        alert("Failed to add distributor. Check console for details.");
    }
}

async function fetchDistributors() {
    distributorList.innerHTML = '<li>Loading distributors...</li>';
    if (!currentAdminUID) { // Prevent fetching if admin UID is not set yet
        distributorList.innerHTML = '<li>Please log in as an administrator to view your data.</li>';
        return;
    }
    try {
        // Query only documents added by the current admin
        const q = query(collection(db, 'distributors'), where('addedByAdminUID', '==', currentAdminUID));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            distributorList.innerHTML = '<li>No distributors added by you yet.</li>';
            return;
        }
        distributorList.innerHTML = '';
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const li = document.createElement('li');
            li.setAttribute('data-id', docSnap.id);
            li.innerHTML = `
                <strong>${data.name}</strong><br>
                Contact: ${data.contact}<br>
                Location: ${data.location}<br>
                Added by: ${data.addedByAdminName || 'Unknown Admin'} (Phone: ${data.addedByAdminPhoneNumber || 'N/A'})
                <button class="delete-distributor-btn">Delete</button>
            `;
            distributorList.appendChild(li);
            // CORRECTED: Pass docSnap.id to deleteDistributor function
            li.querySelector('.delete-distributor-btn').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete ${data.name}?`)) {
                    await deleteDistributor(docSnap.id); // <--- FIX IS HERE
                }
            });
        });
    } catch (error) {
        console.error("Error fetching distributors:", error);
        distributorList.innerHTML = '<li>Error loading distributors.</li>';
    }
}

async function deleteDistributor(id) {
    try {
        await deleteDoc(doc(db, 'distributors', id)); // Using the directly imported deleteDoc and doc
        console.log("Distributor deleted successfully!");
        fetchDistributors();
    } catch (error) {
        console.error("Error deleting distributor:", error);
        alert("Failed to delete distributor. Check console for details.");
    }
}

soilForm.addEventListener('submit', addSoilType);
distributorForm.addEventListener('submit', addDistributor);

// Note: Chatbot logic is now handled entirely by chatbot-script.js