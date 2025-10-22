console.log("✅ UI script loaded");

const feed = $('feed-section');
const dm = $('dm-section');
const profile = $('profile-section');
const mapSection = $('map-section');

const setActive = (id) => {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(id).classList.add('active');
};

$('nav-feed').onclick = () => {
  feed.style.display = 'block';
  dm.style.display = 'none';
  profile.style.display = 'none';
  mapSection.style.display = 'none';
  setActive('nav-feed');
};

$('nav-messages').onclick = () => {
  feed.style.display = 'none';
  dm.style.display = 'block';
  profile.style.display = 'none';
  mapSection.style.display = 'none';
  setActive('nav-messages');
};

$('nav-profile').onclick = () => {
  feed.style.display = 'none';
  dm.style.display = 'none';
  profile.style.display = 'block';
  mapSection.style.display = 'none';
  setActive('nav-profile');
};

$('nav-map').onclick = () => {
  feed.style.display = 'none';
  dm.style.display = 'none';
  profile.style.display = 'none';
  mapSection.style.display = 'block';
  setActive('nav-map');
};
