console.log("✅ Posts system with delete active");

const postModal = $('postModal');
const postsContainer = $('posts');

// === OPEN MODAL ===
$('openModalBtn').onclick = () => {
  if (!auth.currentUser) {
    $('loginPopup').style.display = 'flex';
    return;
  }
  postModal.style.display = 'flex';
};

// === CLOSE MODAL ON CLICK OUTSIDE ===
window.onclick = (e) => {
  if (e.target === postModal) postModal.style.display = 'none';
};

// === PUBLISH POST ===
$('post-btn').onclick = () => {
  const user = auth.currentUser;
  if (!user) return alert('Please log in first.');

  const skill = $('skill').value.trim();
  const location = $('location').value.trim();
  const experience = $('experience').value.trim();
  const description = $('description').value.trim();

  if (!skill || !description) {
    alert('Please fill out required fields.');
    return;
  }

  const postData = {
    uid: user.uid,
    email: user.email,
    skill,
    location,
    experience,
    description,
    timestamp: Date.now()
  };

  db.ref('posts').push(postData);
  postModal.style.display = 'none';
  $('skill').value = $('location').value = $('experience').value = $('description').value = '';
  console.log("✅ Post published");
};

// === DELETE POST (only by owner) ===
function deletePost(postId) {
  const user = auth.currentUser;
  if (!user) return alert("You're not logged in.");
  if (!confirm("Delete this post?")) return;

  db.ref(`posts/${postId}`).once('value', (snap) => {
    const data = snap.val();
    if (!data || data.uid !== user.uid) {
      alert("You can only delete your own posts.");
      return;
    }

    db.ref(`posts/${postId}`).remove()
      .then(() => {
        console.log("🗑️ Post deleted:", postId);
      })
      .catch((err) => {
        console.error("❌ Delete failed:", err);
      });
  });
}

// === FETCH + DISPLAY POSTS ===
db.ref('posts').on('value', async (snapshot) => {
  if (!snapshot.exists()) {
    postsContainer.innerHTML = `<p style="color:#777;">No one has shared yet. Be the first!</p>`;
    return;
  }

  const posts = [];
  snapshot.forEach((child) => {
    posts.push({ id: child.key, ...child.val() });
  });

  posts.sort((a, b) => b.timestamp - a.timestamp);
  postsContainer.innerHTML = '';

  const currentUser = auth.currentUser;

  for (const post of posts) {
    let photoURL = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    if (post.uid) {
      const userSnap = await db.ref('users/' + post.uid + '/photoURL').once('value');
      if (userSnap.exists()) photoURL = userSnap.val();
    }

    // Create post card
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.innerHTML = `
      <img src="${photoURL}" alt="user">
      <div class="post-content">
        <strong>${post.skill}</strong>
        <div class="meta">${post.location || 'Unknown'} · ${post.experience || ''}</div>
        <div class="skills">${post.email}</div>
        <p>${post.description}</p>
      </div>
    `;

    // Add delete button if current user owns the post
    if (currentUser && currentUser.uid === post.uid) {
      const delBtn = document.createElement('button');
      delBtn.textContent = "🗑️ Delete";
      delBtn.style = `
        margin-left:auto;
        padding:6px 10px;
        background:#f44336;
        color:#fff;
        border:none;
        border-radius:6px;
        cursor:pointer;
        font-size:0.85rem;
        transition:0.2s;
      `;
      delBtn.onmouseenter = () => delBtn.style.background = '#d32f2f';
      delBtn.onmouseleave = () => delBtn.style.background = '#f44336';
      delBtn.onclick = () => deletePost(post.id);
      postEl.appendChild(delBtn);
    }

    postsContainer.appendChild(postEl);
  }

  console.log(`✅ Loaded ${posts.length} posts`);
});
