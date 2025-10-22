console.log("✅ Posts script loaded");

const postModal = $('postModal');

$('openModalBtn').onclick = () => {
  if (!auth.currentUser) {
    $('loginPopup').style.display = 'flex';
    return;
  }
  postModal.style.display = 'flex';
};

// close modal on outside click
window.onclick = e => {
  if (e.target === postModal) postModal.style.display = 'none';
};

$('post-btn').onclick = () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first.");
    return;
  }

  const skill = $('skill').value.trim();
  const location = $('location').value.trim();
  const experience = $('experience').value.trim();
  const description = $('description').value.trim();

  if (!skill || !description) return alert("Please fill in the skill and description fields.");

  db.ref('posts').push({
    uid: user.uid,
    email: user.email,
    skill,
    location,
    experience,
    description,
    timestamp: Date.now()
  });

  $('skill').value = $('location').value = $('experience').value = $('description').value = '';
  postModal.style.display = 'none';
};

// --- Load Posts ---
db.ref('posts').on('value', async (snap) => {
  const feed = document.getElementById('posts');
  feed.innerHTML = '';
  const posts = [];
  snap.forEach(p => posts.push({ ...p.val(), id: p.key }));
  posts.sort((a, b) => b.timestamp - a.timestamp);

  for (const v of posts) {
    let photoURL = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    if (v.uid) {
      const userSnap = await db.ref('users/' + v.uid + '/photoURL').once('value');
      if (userSnap.exists()) photoURL = userSnap.val();
    }

    const el = document.createElement('div');
    el.className = 'post';
    el.innerHTML = `
      <img src="${photoURL}" alt="User photo">
      <div class="post-content">
        <strong>${v.skill}</strong>
        <div class="meta">${v.location || 'Unknown'} · ${v.experience || ''}</div>
        <div class="skills">${v.email}</div>
        <p>${v.description}</p>
      </div>`;
    feed.appendChild(el);
  }
});
