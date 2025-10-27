// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {

  apiKey: "AIzaSyC-V-jin4M1hu9Wnz7GPJnV7PuY54coeZo",
  authDomain: "mrit-udbhav.firebaseapp.com",
  projectId: "mrit-udbhav",
  storageBucket: "mrit-udbhav.firebasestorage.app",
  messagingSenderId: "677495378305",
  appId: "1:677495378305:web:a9cf7289ce2cc993715880",
  measurementId: "G-NF5X6YM7RE"

};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore settings
db.settings({
    timestampsInSnapshots: true
});

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.storage = storage;
