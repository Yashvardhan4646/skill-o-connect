// ==========================
//  SkillConnect Posts Module
// ==========================
const { auth, db, $, storage } = window.firebaseApp;

// --- Share Skill Modal ---
// --- Share Skill Modal (with map integration if available) ---
$("post-btn").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return showToast("Please log in first.", "error");

  const skill = $("skill").value.trim();
  const location = $("location").value.trim();
  const experience = $("experience").value.trim();
  const description = $("description").value.trim();

  if (!skill || !description)
    return showToast("Please fill in required fields.", "error");

  let coords = { lat: null, lng: null };

  // Try to get user's coordinates
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      coords.lat = pos.coords.latitude;
      coords.lng = pos.coords.longitude;
    } catch (err) {
      console.warn("Location permission denied, posting without coords.");
    }
  }

  try {
    await db.ref("posts").push({
      uid: user.uid,
      email: user.email,
      skill,
      location,
      experience,
      description,
      latitude: coords.lat,
      longitude: coords.lng,
      timestamp: Date.now(),
    });

    ["skill", "location", "experience", "description"].forEach((id) => {
      $(id).value = "";
    });

    $("postModal").style.display = "none";
    showToast("Skill published successfully!");
  } catch (err) {
    showToast("Failed to publish: " + err.message, "error");
  }
};


// ==========================
//  Feed Loader
// ==========================
async function loadFeed() {
  const feedDiv = $("posts");
  feedDiv.innerHTML = `<p style="color:#777;">Loading posts...</p>`;

  db.ref("posts").on("value", async (snap) => {
    const posts = [];
    snap.forEach(p => {
      const val = p.val();
      val.key = p.key;
      posts.push(val);
    });

    posts.sort((a, b) => b.timestamp - a.timestamp);
    feedDiv.innerHTML = "";

    for (const p of posts) {
      let photoURL = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";

      if (p.uid) {
        const userSnap = await db.ref(`users/${p.uid}/photoURL`).once("value");
        if (userSnap.exists()) photoURL = userSnap.val();
      }

      const post = document.createElement("div");
      post.className = "post";
      post.innerHTML = `
        <img src="${photoURL}" alt="User Photo">
        <div class="post-content">
          <strong>${p.skill || "Untitled Skill"}</strong>
          <div class="meta">${p.location || "Unknown Location"} · ${p.experience || ""}</div>
          <div class="skills">${p.email}</div>
          <p>${p.description || ""}</p>
          <div class="post-actions" style="margin-top:6px;">
            <button class="like-btn" data-id="${p.key}">❤️ Like</button>
            <button class="comment-btn" data-id="${p.key}">💬 Comment</button>
          </div>
          <div class="comments" id="comments-${p.key}" style="margin-top:8px;"></div>
        </div>
      `;
      feedDiv.appendChild(post);
    }

    initPostButtons();
  });
}

// ==========================
//  Like & Comment Logic
// ==========================
function initPostButtons() {
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return alert("Login to like posts.");

      const postId = btn.dataset.id;
      const likeRef = db.ref(`likes/${postId}/${user.uid}`);

      const snap = await likeRef.once("value");
      if (snap.exists()) {
        await likeRef.remove();
        btn.textContent = "❤️ Like";
      } else {
        await likeRef.set(true);
        btn.textContent = "💚 Liked";
      }
    };
  });

  document.querySelectorAll(".comment-btn").forEach(btn => {
    btn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return alert("Login to comment.");

      const postId = btn.dataset.id;
      const comment = prompt("Write a comment:");
      if (!comment) return;

      await db.ref(`comments/${postId}`).push({
        user: user.email,
        text: comment,
        timestamp: Date.now(),
      });

      loadComments(postId);
    };
  });
}

// --- Load Comments under a post ---
async function loadComments(postId) {
  const commentDiv = document.getElementById(`comments-${postId}`);
  commentDiv.innerHTML = "";

  const snap = await db.ref(`comments/${postId}`).once("value");
  snap.forEach(c => {
    const val = c.val();
    const el = document.createElement("div");
    el.style = "font-size:0.85rem;color:#555;margin-top:3px;";
    el.textContent = `${val.user}: ${val.text}`;
    commentDiv.appendChild(el);
  });
}

window.loadFeed = loadFeed;
