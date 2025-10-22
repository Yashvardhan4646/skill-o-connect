// ==========================
//  SkillConnect Core Setup
// ==========================

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCl-etKvWkin6Bfb9TG6aebhAvgU1o4RnM",
  authDomain: "skillo-fc2af.firebaseapp.com",
  databaseURL: "https://skillo-fc2af-default-rtdb.firebaseio.com",
  projectId: "skillo-fc2af",
  storageBucket: "skillo-fc2af.appspot.com",
  messagingSenderId: "482732605481",
  appId: "1:482732605481:web:874516448ecca771531c38",
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// --- Shorthand helper ---
const $ = (id) => document.getElementById(id);

// ==========================
//  Section Navigation
// ==========================
const sections = {
  feed: $("feed-section"),
  map: $("map-section"),
  dm: $("dm-section"),
  profile: $("profile-section"),
};



const navButtons = {
  feed: $("nav-feed"),
  map: $("nav-map"),
  messages: $("nav-messages"),
  profile: $("nav-profile"),
};


function showSection(section) {
  Object.values(sections).forEach((el) => (el.style.display = "none"));
  sections[section].style.display = "block";

  Object.values(navButtons).forEach((btn) => btn.classList.remove("active"));
  navButtons[section].classList.add("active");
}

// --- Hook up nav ---
navButtons.feed.onclick = () => showSection("feed");
navButtons.messages.onclick = () => showSection("dm");
navButtons.profile.onclick = () => showSection("profile");
navButtons.map.onclick = () => {
  showSection("map");
  if (window.initMap) initMap();
};


// ==========================
//  Modal Control
// ==========================
const postModal = $("postModal");
const loginPopup = $("loginPopup");

$("openModalBtn").onclick = () => {
  if (!auth.currentUser) {
    loginPopup.style.display = "flex";
    return;
  }
  postModal.style.display = "flex";
};

// close when clicking outside
window.onclick = (e) => {
  if (e.target === postModal) postModal.style.display = "none";
};

// ==========================
//  Dark Mode Toggle
// ==========================
const darkToggle = $("dark-toggle");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  darkToggle.textContent = "☀️";
}

darkToggle.onclick = () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

// ==========================
//  Auth State Changes
// ==========================
auth.onAuthStateChanged((user) => {
  if (user) {
    $("loginPopup").style.display = "none";
    $("logout-btn").style.display = "block";
    $("user-email-top").textContent = user.email;
    // load posts/profile after login
    if (window.loadFeed) loadFeed();
    if (window.loadProfile) loadProfile();
  } else {
    $("loginPopup").style.display = "flex";
    $("logout-btn").style.display = "none";
    $("user-email-top").textContent = "";
  }
});

// ==========================
//  Expose globals for other modules
// ==========================
window.firebaseApp = { auth, db, storage, $ };
auth.onAuthStateChanged(user => {
  if (user && window.initMap) initMap();
});
