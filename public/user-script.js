// user-script.js
import { db, collection, getDocs, auth, signOut } from './firebase-init.js'; // Ensure auth and signOut are explicitly imported

// Explicitly import doc and getDoc directly from Firestore CDN for robustness
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js"; //


// --- Element Selections (Global Scope) ---
const userSoilList = document.getElementById('user-soil-list');
const userDistributorList = document.getElementById('user-distributor-list');

// Elements for AI Assistant (Soil Recommendation)
const aiRecommendationInput = document.getElementById('ai-recommendation-input');
const getAiRecommendationBtn = document.getElementById('get-ai-recommendation-btn');
const aiRecommendationStatus = document.getElementById('ai-recommendation-status');
const aiRecommendationOutput = document.getElementById('ai-recommendation-output');

// Elements for Crop Disease & Pest Identifier
const cropImageUpload = document.getElementById('crop-image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const uploadedCropImage = document.getElementById('uploaded-crop-image');
const clearCropImageBtn = document.getElementById('clear-crop-image');
const cropSymptomsInput = document.getElementById('crop-symptoms-input');
const getCropDiagnosisBtn = document.getElementById('get-crop-diagnosis-btn');
const cropDiagnosisStatus = document.getElementById('crop-diagnosis-status');
const cropDiagnosisOutput = document.getElementById('crop-diagnosis-output');

// Elements for Soil Filtering
const soilFilterInput = document.getElementById('soil-filter-input');
const filterSoilBtn = document.getElementById('filter-soil-btn');
const clearSoilFilterBtn = document = document.getElementById('clear-soil-filter-btn');

// Elements for Distributor Filtering
const distributorNameFilter = document.getElementById('distributor-name-filter');
const distributorLocationFilter = document.getElementById('distributor-location-filter');
const filterDistributorsBtn = document.getElementById('filter-distributors-btn');
const clearDistributorFilterBtn = document.getElementById('clear-distributor-filter-btn');

// User Logout Button
const userLogoutBtn = document.getElementById('user-logout-btn');


let selectedCropImageFile = null; // To store the selected crop image file

// Store all fetched data
let allSoilTypes = [];
let allDistributors = []; // Store all fetched distributor data

// --- Initial Element Check (Global Scope) ---
console.log('user-script.js loaded.');
console.log('--- Initial Element Checks ---');
console.log('userSoilList:', userSoilList);
console.log('userDistributorList:', userDistributorList);
console.log('aiRecommendationInput:', aiRecommendationInput);
console.log('getAiRecommendationBtn:', getAiRecommendationBtn);
console.log('cropImageUpload:', cropImageUpload);
console.log('imagePreviewContainer:', imagePreviewContainer);
console.log('uploadedCropImage:', uploadedCropImage);
console.log('clearCropImageBtn:', clearCropImageBtn);
console.log('cropSymptomsInput:', cropSymptomsInput);
console.log('getCropDiagnosisBtn:', getCropDiagnosisBtn);
console.log('soilFilterInput:', soilFilterInput);
console.log('filterSoilBtn:', filterSoilBtn);
console.log('clearSoilFilterBtn:', clearSoilFilterBtn);
console.log('distributorNameFilter:', distributorNameFilter);
console.log('distributorLocationFilter:', distributorLocationFilter);
console.log('filterDistributorsBtn:', filterDistributorsBtn);
console.log('clearDistributorFilterBtn:', clearDistributorFilterBtn);
console.log('userLogoutBtn:', userLogoutBtn);
console.log('------------------------------');


async function fetchUserSoilTypes() {
    userSoilList.innerHTML = '<li>Loading soil types...</li>';
    try {
        const querySnapshot = await getDocs(collection(db, 'soil_types'));
        console.log("Fetched soil types:", querySnapshot.docs.map(doc => doc.data()));
        if (querySnapshot.empty) {
            userSoilList.innerHTML = '<li>No soil types available.</li>';
            allSoilTypes = [];
            return;
        }
        allSoilTypes = querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            data: docSnap.data()
        }));
        displaySoilTypes(allSoilTypes);
    } catch (error) {
        console.error("Detailed error (Soil Types):", error);
        userSoilList.innerHTML = '<li>Error loading soil types. Make sure your Firebase security rules allow read access for authenticated users.</li>';
        allSoilTypes = [];
    }
}

function displaySoilTypes(soilsToDisplay) {
    userSoilList.innerHTML = '';
    if (soilsToDisplay.length === 0) {
        userSoilList.innerHTML = '<li>No matching soil types found.</li>';
        return;
    }
    soilsToDisplay.forEach(item => {
        const data = item.data;
        const li = document.createElement('li');

        const adminName = data.addedByAdminName || 'Unknown Admin';
        const adminPhoneNumber = data.addedByAdminPhoneNumber || data.addedByAdminPhone || 'N/A';

        li.innerHTML = `
            <strong>${data.name}</strong><br>
            pH: ${data.pH}<br>
            Nutrients: ${data.nutrients}<br>
            Water Retention: ${data.waterRetention}<br>
            Recommended Crops: ${Array.isArray(data.recommendedCrops) ? data.recommendedCrops.join(', ') : 'N/A'}<br>
            Added by: ${adminName} (Contact: ${adminPhoneNumber})
        `;
        userSoilList.appendChild(li);
    });
}

function filterAndDisplaySoils() {
    const filterText = soilFilterInput.value.trim().toLowerCase();

    if (!filterText) {
        displaySoilTypes(allSoilTypes);
        return;
    }

    const filteredSoils = allSoilTypes.filter(item => {
        return item.data.name.toLowerCase().includes(filterText);
    });

    displaySoilTypes(filteredSoils);
}

if (filterSoilBtn) {
    filterSoilBtn.addEventListener('click', filterAndDisplaySoils);
}

if (clearSoilFilterBtn) {
    clearSoilFilterBtn.addEventListener('click', () => {
        soilFilterInput.value = '';
        displaySoilTypes(allSoilTypes);
    });
}


async function fetchUserDistributors() {
    userDistributorList.innerHTML = '<li>Loading distributors...</li>';
    try {
        const querySnapshot = await getDocs(collection(db, 'distributors'));
        console.log("Fetched distributors:", querySnapshot.docs.map(doc => doc.data()));
        if (querySnapshot.empty) {
            userDistributorList.innerHTML = '<li>No distributors available.</li>';
            allDistributors = [];
            return;
        }
        allDistributors = querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            data: docSnap.data()
        }));
        displayDistributors(allDistributors);
    } catch (error) {
        console.error("Detailed error (Distributors):", error);
        userDistributorList.innerHTML = '<li>Error loading distributors. Make sure your Firebase security rules allow read access for authenticated users.</li>';
        allDistributors = [];
    }
}

function displayDistributors(distributorsToDisplay) {
    userDistributorList.innerHTML = '';
    if (distributorsToDisplay.length === 0) {
        userDistributorList.innerHTML = '<li>No matching distributors found.</li>';
        return;
    }
    distributorsToDisplay.forEach(item => {
        const data = item.data;
        const li = document.createElement('li');

        const adminName = data.addedByAdminName || 'Unknown Admin';
        const adminPhoneNumber = data.addedByAdminPhoneNumber || data.addedByAdminPhone || 'N/A';

        li.innerHTML = `
            <strong>${data.name}</strong><br>
            Contact: ${data.contact}<br>
            Location: ${data.location}<br>
            Added by: ${adminName} (Phone: ${adminPhoneNumber})
        `;
        userDistributorList.appendChild(li);
    });
}

function filterAndDisplayDistributors() {
    const nameFilterText = distributorNameFilter.value.trim().toLowerCase();
    const locationFilterText = distributorLocationFilter.value.trim().toLowerCase();

    if (!nameFilterText && !locationFilterText) {
        displayDistributors(allDistributors);
        return;
    }

    const filteredDistributors = allDistributors.filter(item => {
        const nameMatches = item.data.name.toLowerCase().includes(nameFilterText);
        const locationMatches = item.data.location.toLowerCase().includes(locationFilterText);

        if (nameFilterText && locationFilterText) {
            return nameMatches && locationMatches;
        } else if (nameFilterText) {
            return nameMatches;
        } else if (locationFilterText) {
            return locationMatches;
        }
        return false;
    });

    displayDistributors(filteredDistributors);
}

if (filterDistributorsBtn) {
    filterDistributorsBtn.addEventListener('click', filterAndDisplayDistributors);
}

if (clearDistributorFilterBtn) {
    clearDistributorFilterBtn.addEventListener('click', () => {
        distributorNameFilter.value = '';
        distributorLocationFilter.value = '';
        displayDistributors(allDistributors);
    });
}


function displayStatusMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? 'red' : 'green';
    setTimeout(() => {
        element.textContent = '';
        element.style.color = '';
    }, 5000);
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}


// AI Recommendation Logic (Existing)
if (getAiRecommendationBtn) {
    getAiRecommendationBtn.addEventListener('click', async () => {
        console.log('AI Recommendation button clicked!');
        const userPrompt = aiRecommendationInput.value.trim();

        if (!userPrompt) {
            displayStatusMessage(aiRecommendationStatus, 'Please describe your farming needs to get a recommendation.', true);
            return;
        }

        displayStatusMessage(aiRecommendationStatus, 'Generating recommendation...', false);
        getAiRecommendationBtn.disabled = true;
        aiRecommendationOutput.innerHTML = '';

        try {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: `As a soil farming agent AI, provide a very concise, summarized, and easy-to-understand soil and crop recommendation based on the following user description. Use simple language and brief bullet points if necessary don't use ## and ** in conversation.

            User Description: ${userPrompt}` }] });

            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will automatically provide the API key
            const apiUrl = `https://rootify-back.onrender.com/ask-gemini`; // Updated to use your live backend URL

            console.log('Sending AI Recommendation request to backend:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('AI Recommendation response received from backend:', response);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Backend error response data for AI Recommendation:", errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('AI Recommendation backend response JSON:', result);

            if (result.response) {
                const aiResponseText = result.response;
                aiRecommendationOutput.innerHTML = `<p>${aiResponseText.replace(/\n/g, '<br>')}</p>`;
                displayStatusMessage(aiRecommendationStatus, 'Recommendation generated successfully!', false);
                console.log('AI Recommendation response displayed.');
            } else {
                aiRecommendationOutput.innerHTML = '<p>Sorry, I could not generate a recommendation. Please try rephrasing your request.</p>';
                displayStatusMessage(aiRecommendationStatus, 'Failed to get recommendation.', true);
                console.warn('AI Recommendation response was empty or malformed.');
            }

        } catch (error) {
            console.error("Error calling Gemini API for Soil Recommendation:", error);
            aiRecommendationOutput.innerHTML = `<p>An error occurred: ${error.message}. Please try again.</p>`;
            displayStatusMessage(aiRecommendationStatus, `Error: ${error.message}`, true);
        } finally {
            getAiRecommendationBtn.disabled = false;
            console.log('AI Recommendation analysis complete, button re-enabled.');
        }
    });
}

// Crop Disease & Pest Identification Logic (Existing)
if (cropImageUpload) {
    console.log('Adding event listener to cropImageUpload.');
    cropImageUpload.addEventListener('change', (event) => {
        console.log('Image file selected!');
        selectedCropImageFile = event.target.files[0];
        if (selectedCropImageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedCropImage.src = e.target.result;
                imagePreviewContainer.style.display = 'flex'; // Show the image preview container
                console.log('Image preview updated.');
            };
            reader.readAsDataURL(selectedCropImageFile);
        } else {
            imagePreviewContainer.style.display = 'none';
            uploadedCropImage.src = '#';
            console.log('No image selected, preview hidden.');
        }
    });
}

if (clearCropImageBtn) {
    console.log('Adding event listener to clearCropImageBtn.');
    clearCropImageBtn.addEventListener('click', () => {
        console.log('Clear image button clicked.');
        selectedCropImageFile = null;
        cropImageUpload.value = ''; // Clear the file input
        uploadedCropImage.src = '#';
        imagePreviewContainer.style.display = 'none';
    });
}

if (getCropDiagnosisBtn) {
    console.log('Adding event listener to getCropDiagnosisBtn.');
    getCropDiagnosisBtn.addEventListener('click', async () => {
        console.log('Analyze Plant button clicked!');
        const symptomsText = cropSymptomsInput.value.trim();

        if (!selectedCropImageFile && !symptomsText) {
            displayStatusMessage(cropDiagnosisStatus, 'Please upload an image or describe symptoms.', true);
            console.warn('Attempted analysis without image or symptoms.');
            return;
        }

        displayStatusMessage(cropDiagnosisStatus, 'Analyzing plant...', false);
        getCropDiagnosisBtn.disabled = true;
        cropDiagnosisOutput.innerHTML = '';
        console.log('Starting AI analysis...');

        let imageData = null;
        let imageMimeType = null;

        if (selectedCropImageFile) {
            console.log('Processing image for upload...');
            try {
                imageData = await getBase64(selectedCropImageFile);
                imageMimeType = selectedCropImageFile.type;
                console.log('Image converted to Base64.');
            } catch (error) {
                console.error('Error converting crop image to Base64:', error);
                displayStatusMessage(cropDiagnosisStatus, 'Error processing image. Please try again.', true);
                getCropDiagnosisBtn.disabled = false;
                return;
            }
        }

        try {
            const parts = [];
            if (symptomsText) {
                parts.push({ text: `Analyze the following plant image for diseases or pests based on the symptoms described. Provide a very concise, summarized, and easy-to-understand diagnosis and specific recommendations for treatment or prevention. Use simple language and brief bullet points if necessary.don't use ## and ** in solution.\n\nSymptoms: ${symptomsText}` });
                console.log('Text prompt included.');
            } else {
                parts.push({ text: `Analyze the following plant image for diseases or pests. Provide a very concise, summarized, and easy-to-understand diagnosis and specific recommendations for treatment or prevention. Use simple language and brief bullet points if necessary.don't use ## and ** in solution` });
                console.log('Image-only prompt included.');
            }

            if (imageData && imageMimeType) {
                parts.push({
                    inlineData: {
                        mimeType: imageMimeType,
                        data: imageData
                    }
                });
                console.log('Image data included in parts.');
            }

            const payload = { contents: [{ role: "user", parts: parts }] };
            const apiKey = "";
            const apiUrl = `https://rootify-back.onrender.com/ask-gemini`; // Updated to use your live backend URL

            console.log('Sending request to backend:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Response received from backend:', response);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Backend error response data:", errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Backend response JSON:', result);

            if (result.response) {
                const aiResponseText = result.response;
                cropDiagnosisOutput.innerHTML = `<p>${aiResponseText.replace(/\n/g, '<br>')}</p>`;
                displayStatusMessage(cropDiagnosisStatus, 'Diagnosis generated successfully!', false);
                console.log('AI response displayed.');
            } else {
                cropDiagnosisOutput.innerHTML = '<p>Sorry, I could not diagnose the issue. Please try with a clearer image or more detailed symptoms.</p>';
                displayStatusMessage(cropDiagnosisStatus, 'Failed to get diagnosis.', true);
                console.warn('AI response was empty or malformed.');
            }

        } catch (error) {
            console.error("Error calling Gemini API for Crop Diagnosis:", error);
            cropDiagnosisOutput.innerHTML = `<p>An error occurred: ${error.message}. Please try again.</p>`;
            displayStatusMessage(cropDiagnosisStatus, `Error: ${error.message}`, true);
        } finally {
            getCropDiagnosisBtn.disabled = false;
            console.log('Analysis complete, button re-enabled.');
        }
    });
}

// Logout functionality for user page
if (userLogoutBtn) {
    userLogoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth); // 'auth' imported from firebase-init.js
            console.log("User successfully signed out from user.html.");
            window.location.href = 'index.html'; // Redirect to the main login page
        } catch (error) {
            console.error("Error signing out from user.html:", error);
            alert("Failed to log out. Please try again.");
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Initializing data fetches.');
    fetchUserSoilTypes();
    fetchUserDistributors();
});