// ==========================
//  SkillConnect Map Module
// ==========================
const { auth, db, $ } = window.firebaseApp;

let map;
let userMarker;
let postMarkers = [];

// --- Initialize map ---
function initMap() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  map = L.map("map").setView([20.5937, 78.9629], 5); // center on India

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  loadMapPosts();
}

// --- Load skill posts on map ---
function loadMapPosts() {
  db.ref("posts").on("value", async (snap) => {
    postMarkers.forEach((m) => map.removeLayer(m));
    postMarkers = [];

    snap.forEach((p) => {
      const val = p.val();
      if (val.latitude && val.longitude) {
        const marker = L.marker([val.latitude, val.longitude])
          .addTo(map)
          .bindPopup(
            `<b>${val.skill}</b><br>${val.email}<br>${val.location || ""}`
          );
        postMarkers.push(marker);
      }
    });
  });
}

// --- Attach location picker to post modal ---
const postBtn = $("post-btn");
if (postBtn) {
  postBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) return showToast("Login first!", "error");

    const skill = $("skill").value.trim();
    const location = $("location").value.trim();
    const experience = $("experience").value.trim();
    const description = $("description").value.trim();

    if (!skill || !description) return showToast("Please fill required fields", "error");

    let coords = null;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      showToast("Couldn’t get your location (posting anyway)");
    }

    await db.ref("posts").push({
      uid: user.uid,
      email: user.email,
      skill,
      location,
      experience,
      description,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      timestamp: Date.now(),
    });

    ["skill", "location", "experience", "description"].forEach((id) => ($(id).value = ""));
    $("postModal").style.display = "none";
    showToast("Skill shared successfully!");
  };
}

window.initMap = initMap;
