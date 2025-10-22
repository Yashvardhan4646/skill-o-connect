// Firebase global setup
const firebaseConfig = {
  apiKey: "AIzaSyCl-etKvWkin6Bfb9TG6aebhAvgU1o4RnM",
  authDomain: "skillo-fc2af.firebaseapp.com",
  databaseURL: "https://skillo-fc2af-default-rtdb.firebaseio.com",
  projectId: "skillo-fc2af",
  storageBucket: "skillo-fc2af.firebasestorage.app",
  messagingSenderId: "482732605481",
  appId: "1:482732605481:web:874516448ecca771531c38"
};

// Initialize Firebase once
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// Global access
window.auth = firebase.auth();
window.db = firebase.database();
window.storage = firebase.storage();

// Shorthand for IDs
window.$ = (id) => document.getElementById(id);

console.log("✅ Firebase initialized globally");
