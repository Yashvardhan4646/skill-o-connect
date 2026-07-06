console.log("✅ Interactive Leaflet Live Map with Proximity & Search Ready");

let map;
let userMarker;
let markers = [];
let userCurrentLat = null;
let userCurrentLng = null;

// Haversine Distance Formula in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

const createUserPin = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;
      background:#9FA1FF;border:3px solid #fff;border-radius:3px;
      box-shadow:0 4px 14px rgba(159,161,255,.6);">
      <div style="position:absolute;top:-8px;left:-8px;width:34px;height:34px;
        border-radius:3px;background:rgba(159,161,255,.3);
        animation:pulseRing 2s infinite;"></div>
    </div>
    <style>@keyframes pulseRing{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.7);opacity:0}}</style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createSkillPin = (skillName, rating) => L.divIcon({
  className: '',
  html: `
    <div style="background:#fff;border:2px solid #9FA1FF;padding:4px 10px;
      border-radius:3px;font-weight:700;font-size:0.78rem;color:#181925;
      box-shadow:0 4px 12px rgba(159,161,255,.25);
      display:flex;align-items:center;gap:4px;white-space:nowrap;">
      <i class="fa-solid fa-location-dot" style="color:#9FA1FF;"></i> ${skillName}
      <span style="color:#F59E0B;margin-left:4px;">★ ${rating || '5.0'}</span>
    </div>`,
  iconSize: [140, 30],
  iconAnchor: [70, 15]
});

function initLiveMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;

  if (map) { map.invalidateSize(); return; }

  map = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        userCurrentLat = lat;
        userCurrentLng = lng;

        userMarker = L.marker([lat, lng], { icon: createUserPin() })
          .addTo(map)
          .bindPopup('<b><i class="fa-solid fa-location-crosshairs"></i> Your Location</b>')
          .openPopup();
        map.setView([lat, lng], 13);
        loadSkillMarkers(lat, lng);
      },
      () => loadSkillMarkers()
    );
  } else {
    loadSkillMarkers();
  }
}

// ── Search & Fly to Location on Map ──────────────────────────
const mapSearchBtn = document.getElementById('map-search-btn');
const mapSearchInput = document.getElementById('map-search-input');

async function handleMapLocationSearch() {
  const query = mapSearchInput?.value.trim();
  if (!query) return showToast('Please enter a city or neighborhood to search.', 'info');

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data && data[0]) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (map) {
        map.flyTo([lat, lon], 13, { duration: 1.5 });
        showToast(`Jumped map location to "${query}" ✨`, 'success');
      }
    } else {
      showToast(`Location "${query}" not found on map.`, 'error');
    }
  } catch (err) {
    showToast('Failed to geocode location.', 'error');
  }
}

if (mapSearchBtn) mapSearchBtn.onclick = handleMapLocationSearch;
if (mapSearchInput) {
  mapSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleMapLocationSearch();
  });
}

// ── Load Posts & Map Pins Safely (Ultra-Safe Column Selection) ──
async function loadSkillMarkers(userLat, userLng) {
  if (!map) return;

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  let { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(photo_url)');

  if (error || !posts) {
    const { data: rawPosts } = await supabase.from('posts').select('*');
    if (rawPosts && rawPosts.length > 0) {
      const userIds = Array.from(new Set(rawPosts.map(p => p.user_id)));
      const { data: profs } = await supabase.from('profiles').select('id, photo_url').in('id', userIds);
      const profMap = new Map();
      (profs || []).forEach(pr => profMap.set(pr.id, pr));

      posts = rawPosts.map(p => ({
        ...p,
        profiles: profMap.get(p.user_id) || null
      }));
    } else {
      posts = [];
    }
  }

  for (const post of posts) {
    let lat = post.latitude;
    let lng = post.longitude;

    if (!lat && post.location && post.location.toLowerCase() !== 'remote') {
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(post.location)}`);
        const json = await res.json();
        if (json[0]) { lat = parseFloat(json[0].lat); lng = parseFloat(json[0].lon); }
      } catch (_) {}
    }

    if (!lat || !lng) continue;

    const rating = post.profiles?.rating || '5.0';
    const distStr = calculateDistance(userCurrentLat || userLat, userCurrentLng || userLng, lat, lng);

    const marker = L.marker([lat, lng], { icon: createSkillPin(post.skill, rating) })
      .addTo(map)
      .bindPopup(`
        <div style="padding:6px;min-width:190px;">
          <b style="font-size:1rem;color:#9FA1FF;">${escapeHtml(post.skill)}</b>
          <div style="font-size:0.8rem;color:#F59E0B;font-weight:700;margin-top:2px;">★ ${rating} Rating</div>
          ${distStr ? `<div style="font-size:0.8rem;color:#12492D;font-weight:700;margin-top:2px;"><i class="fa-solid fa-location-arrow"></i> ${distStr} away</div>` : ''}
          <div style="font-size:0.85rem;color:#5A5D75;margin-top:2px;">📍 ${escapeHtml(post.location || 'Unknown')}</div>
          <div style="font-size:0.82rem;color:#8E92AA;margin-bottom:8px;">✉️ ${escapeHtml(post.email)}</div>
          <a href="post.html?id=${post.id}" class="btn-secondary" style="display:block;text-align:center;padding:4px 8px;font-size:0.75rem;margin-bottom:6px;text-decoration:none;">
            <i class="fa-solid fa-up-right-from-square"></i> View Details
          </a>
          <button class="primary" style="padding:5px 10px;font-size:0.78rem;width:100%;" onclick="openExchangeModal('${post.id}', '${post.user_id}', '${escapeHtml(post.skill)}')">
            <i class="fa-solid fa-handshake"></i> Request Exchange
          </button>
        </div>`);

    markers.push(marker);
  }

  setTimeout(() => {
    if (markers.length > 0) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
    } else if (userLat && userLng) {
      map.setView([userLat, userLng], 13);
    }
  }, 1000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const navMapBtn = document.getElementById('nav-map');
if (navMapBtn) {
  navMapBtn.addEventListener('click', () => {
    setTimeout(() => {
      initLiveMap();
      if (map) map.invalidateSize();
    }, 300);
  });
}
