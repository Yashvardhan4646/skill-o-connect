console.log("✅ Dynamic Leaflet Map loaded");

let map;
let markers = [];

// Initialize Leaflet Map
function initLeafletMap() {
  map = L.map('map').setView([20.5937, 78.9629], 5); // India default

  // Add OpenStreetMap layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  loadMarkers(); // load posts when map initializes
}

// Load skill markers from Firebase posts
async function loadMarkers() {
  if (!db) return console.error("Firebase DB not ready");

  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  db.ref('posts').once('value', async (snap) => {
    const posts = [];
    snap.forEach(p => posts.push(p.val()));

    for (const post of posts) {
      if (!post.location) continue;

      // Convert location name to coordinates using OpenStreetMap Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(post.location)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];

          const marker = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(map);
          marker.bindPopup(`
            <b>${post.skill || 'Unknown Skill'}</b><br>
            ${post.experience || ''}<br>
            📍 ${post.location}<br>
            ✉️ ${post.email}
          `);

          markers.push(marker);
        }
      } catch (e) {
        console.error("Geocoding failed for:", post.location, e);
      }
    }

    console.log(`✅ Loaded ${markers.length} markers`);
  });
}

// Open map and refresh size
document.getElementById("nav-map").addEventListener("click", () => {
  setTimeout(() => {
    if (!map) initLeafletMap();
    map.invalidateSize(); // Fix rendering issue when hidden initially
  }, 300);
});
