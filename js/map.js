console.log("✅ Leaflet Live Map Ready");

let map;
let userMarker;
let markers = [];

// === Initialize the map when the user opens the Map tab ===
function initLiveMap() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return console.error("❌ #map not found");

  if (map) {
    map.invalidateSize();
    return;
  }

  // Create map
  map = L.map("map").setView([20.5937, 78.9629], 5);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Try to locate user
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        userMarker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("📍 You are here")
          .openPopup();
        map.setView([latitude, longitude], 13);

        loadSkillMarkers(latitude, longitude);
      },
      (err) => {
        console.warn("⚠️ Location access denied:", err.message);
        loadSkillMarkers();
      }
    );
  } else {
    console.warn("❌ Geolocation not supported by browser");
    loadSkillMarkers();
  }
}

// === Load markers for all shared skills ===
async function loadSkillMarkers(userLat, userLng) {
  if (!db) return console.error("❌ Firebase DB missing");

  db.ref("posts").once("value", async (snap) => {
    markers.forEach((m) => map.removeLayer(m)); // clear old
    markers = [];

    snap.forEach(async (child) => {
      const post = child.val();
      if (!post.skill) return;

      let lat = null, lon = null;

      // If post already has live coordinates — use them
      if (post.latitude && post.longitude) {
        lat = post.latitude;
        lon = post.longitude;
      } 
      // Otherwise fallback to text geocode
      else if (post.location) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(post.location)}`
          );
          const data = await res.json();
          if (data[0]) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
          }
        } catch (err) {
          console.error("❌ Failed to geocode:", post.location, err);
        }
      }

      // If we have coordinates, add marker
      if (lat && lon) {
        const marker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`
            <b>${post.skill}</b><br>
            ${post.experience || ""}<br>
            📍 ${post.location || "Unknown"}<br>
            ✉️ ${post.email}
          `);
        markers.push(marker);
      }
    });

    // Adjust view after markers are loaded
    setTimeout(() => {
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
      } else if (userLat && userLng) {
        map.setView([userLat, userLng], 13);
      }
    }, 1200);
  });
}

// === Open map when "Map" tab clicked ===
document.getElementById("nav-map").addEventListener("click", () => {
  setTimeout(() => {
    initLiveMap();
    if (map) map.invalidateSize();
  }, 400);
});
