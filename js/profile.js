console.log("✅ Profile system active");

const uploadInput = $('profile-upload');
const uploadBtn = $('upload-pic-btn');
const profilePic = $('profile-pic');
const yourPostsDiv = $('your-posts');

// === Upload Profile Picture ===
uploadBtn.onclick = () => {
  const user = auth.currentUser;
  const file = uploadInput.files[0];

  if (!user) return alert('Please log in first.');
  if (!file) return alert('Select a file to upload.');

  const storageRef = storage.ref(`profile_pictures/${user.uid}/${file.name}`);
  const uploadTask = storageRef.put(file);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      );
      uploadBtn.textContent = `Uploading ${progress}%`;
    },
    (error) => {
      alert('Upload failed: ' + error.message);
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload';
    },
    () => {
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        db.ref('users/' + user.uid).update({ photoURL: downloadURL });
        user.updateProfile({ photoURL: downloadURL });
        profilePic.src = downloadURL;
        uploadBtn.textContent = 'Uploaded!';
        uploadBtn.disabled = false;
      });
    }
  );
};

// === Load Profile Photo ===
auth.onAuthStateChanged((user) => {
  if (user) {
    db.ref('users/' + user.uid + '/photoURL').once('value', (snap) => {
      const url = snap.val();
      profilePic.src = url || 'https://via.placeholder.com/80';
    });
    loadUserPosts(user.uid);
  } else {
    profilePic.src = 'https://via.placeholder.com/80';
    yourPostsDiv.innerHTML = '';
  }
});

// === Load Your Posts ===
function loadUserPosts(uid) {
  yourPostsDiv.innerHTML = `<p style="color:#777;">Loading your posts...</p>`;

  db.ref('posts').orderByChild('uid').equalTo(uid).on('value', async (snapshot) => {
    if (!snapshot.exists()) {
      yourPostsDiv.innerHTML = `<p style="color:#777;">You haven’t shared any skills yet.</p>`;
      return;
    }

    const posts = [];
    snapshot.forEach((child) => {
      posts.push(child.val());
    });

    posts.sort((a, b) => b.timestamp - a.timestamp);
    yourPostsDiv.innerHTML = '';

    for (const post of posts) {
      const card = document.createElement('div');
      card.className = 'post';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div class="post-content">
          <strong>${post.skill}</strong>
          <div class="meta">${post.location || 'Unknown'} · ${post.experience || ''}</div>
          <p>${post.description}</p>
        </div>
      `;
      yourPostsDiv.appendChild(card);
    }
  });
}
