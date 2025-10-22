// ==========================
//  SkillConnect Profile Module
// ==========================

async function loadProfile() {
  const user = auth.currentUser;
  const pic = $("profile-pic");
  const uploadBtn = $("upload-pic-btn");
  const uploadInput = $("profile-upload");
  const userPostsDiv = $("user-posts");

  if (!user) {
    pic.src = "https://via.placeholder.com/80";
    userPostsDiv.innerHTML = "<p>Please log in to view your profile.</p>";
    return;
  }

  // --- Load profile photo ---
  const userSnap = await db.ref("users/" + user.uid + "/photoURL").once("value");
  if (userSnap.exists()) pic.src = userSnap.val();

  // --- Load your posts ---
  const snap = await db.ref("posts").orderByChild("uid").equalTo(user.uid).once("value");
  const posts = [];
  snap.forEach((p) => posts.push(p.val()));

  posts.sort((a, b) => b.timestamp - a.timestamp);
  userPostsDiv.innerHTML = "";

  if (posts.length === 0) {
    userPostsDiv.innerHTML = "<p style='color:#777;'>You haven’t shared any skills yet.</p>";
  } else {
    posts.forEach((p) => {
      const el = document.createElement("div");
      el.className = "post";
      el.innerHTML = `
        <img src="${pic.src}" alt="Profile Pic">
        <div class="post-content">
          <strong>${p.skill}</strong>
          <div class="meta">${p.location || "Unknown"} · ${p.experience || ""}</div>
          <p>${p.description}</p>
        </div>
      `;
      userPostsDiv.appendChild(el);
    });
  }

  // --- Handle profile photo upload ---
  uploadBtn.onclick = async () => {
    const file = uploadInput.files[0];
    if (!file) return alert("Please select a photo first.");

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    const ref = storage.ref(`profile_pictures/${user.uid}/${file.name}`);
    const uploadTask = ref.put(file);

    uploadTask.on(
      "state_changed",
      (snap) => {
        const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        uploadBtn.textContent = `Uploading ${progress}%`;
      },
      (err) => {
        alert("Upload failed: " + err.message);
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload";
      },
      async () => {
        const url = await ref.getDownloadURL();
        await db.ref("users/" + user.uid).update({ photoURL: url });
        await user.updateProfile({ photoURL: url });
        pic.src = url;
        uploadBtn.textContent = "Uploaded!";
        uploadBtn.disabled = false;
      }
    );
  };
}

window.loadProfile = loadProfile;
