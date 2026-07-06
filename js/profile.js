console.log("✅ Profile Dashboard, Founder VIP & Achievement Badges System active");

const uploadInput = document.getElementById('profile-upload');
const uploadBtn   = document.getElementById('upload-pic-btn');
const profilePic  = document.getElementById('profile-pic');
const yourPostsDiv = document.getElementById('your-posts');

const PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

let currentProfileTab = 'my-posts';

// ── Profile Sub-tabs Switcher ────────────────────────────────
const tabMyPosts  = document.getElementById('tab-my-posts');
const tabRequests = document.getElementById('tab-requests');
const tabSaved    = document.getElementById('tab-saved');

if (tabMyPosts) {
  tabMyPosts.onclick = () => {
    switchProfileTab('my-posts');
  };
}
if (tabRequests) {
  tabRequests.onclick = () => {
    switchProfileTab('requests');
  };
}
if (tabSaved) {
  tabSaved.onclick = () => {
    switchProfileTab('saved');
  };
}

function switchProfileTab(tab) {
  currentProfileTab = tab;
  [tabMyPosts, tabRequests, tabSaved].forEach(t => {
    if (t) t.classList.remove('active');
  });

  if (tab === 'my-posts' && tabMyPosts) tabMyPosts.classList.add('active');
  if (tab === 'requests' && tabRequests) tabRequests.classList.add('active');
  if (tab === 'saved' && tabSaved) tabSaved.classList.add('active');

  renderProfileTabContent();
}

async function renderProfileTabContent() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !yourPostsDiv) return;

  yourPostsDiv.innerHTML = '<p style="color:var(--text-muted);">Loading content...</p>';

  if (currentProfileTab === 'my-posts') {
    loadUserPosts(user.id);
  } else if (currentProfileTab === 'requests') {
    loadExchangeRequests(user.id);
  } else if (currentProfileTab === 'saved') {
    loadSavedPosts(user.id);
  }
}

// ── EDITABLE LEARNING GOALS SYSTEM ─────────────────────────────
function openEditGoalsModal() {
  document.getElementById('editGoalsModal')?.classList.add('active');
}

const saveGoalsBtn = document.getElementById('save-goals-btn');
if (saveGoalsBtn) {
  saveGoalsBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in first.', 'error');

    const input = document.getElementById('input-learning-goals');
    const goals = input ? input.value.trim() : '';

    saveGoalsBtn.disabled = true;
    saveGoalsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const { error } = await supabase
      .from('profiles')
      .update({ learning_goals: goals })
      .eq('id', user.id);

    saveGoalsBtn.disabled = false;
    saveGoalsBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Goals';

    if (error) {
      showToast('Failed to save goals: ' + error.message, 'error');
    } else {
      showToast('Learning goals saved successfully! ✨', 'success');
      document.getElementById('editGoalsModal')?.classList.remove('active');
      const displayEl = document.getElementById('display-learning-goals');
      if (displayEl) displayEl.textContent = goals || 'No learning goals saved yet. Click "Edit" to customize your mentorship objectives!';
    }
  };
}

// ── Upload Profile Picture ───────────────────────────────────
if (uploadBtn) {
  uploadBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in first.', 'error');

    const file = uploadInput?.files[0];
    if (!file) return showToast('Select an image file to upload.', 'error');

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast('Upload failed: ' + uploadError.message, 'error');
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload';
      return;
    }

    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: photoUrl })
      .eq('id', user.id);

    if (!updateError) {
      if (profilePic) profilePic.src = photoUrl;
      showToast('Profile picture updated successfully!', 'success');
    }

    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded!';
  };
}

// ── Load Profile Dashboard Stats, Founder VIP & Achievement Badges ─
async function loadProfileDashboard(user) {
  if (!user) return;

  const isFounder = user.email && user.email.toLowerCase() === 'yashvardhan@atomicmail.io';

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profilePic) {
    profilePic.src = profile?.photo_url || PLACEHOLDER;
    if (isFounder) {
      profilePic.style.border = '3px solid #F59E0B';
      profilePic.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.45)';
    }
  }

  const nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) {
    nameDisplay.innerHTML = `${escapeHtml(user.email)} ${isFounder ? '<i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:1rem;" title="Verified Owner"></i>' : ''}`;
  }

  const statRating = document.getElementById('stat-rating-display');
  if (statRating) {
    statRating.innerHTML = isFounder ? '<span style="color:#F59E0B;">★ 5.00</span>' : `★ ${profile?.rating || '5.0'}`;
  }

  const displayGoals = document.getElementById('display-learning-goals');
  const inputGoals   = document.getElementById('input-learning-goals');
  if (profile?.learning_goals) {
    if (displayGoals) displayGoals.textContent = profile.learning_goals;
    if (inputGoals)   inputGoals.value = profile.learning_goals;
  }

  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const statPosts = document.getElementById('stat-posts-cnt');
  if (statPosts) statPosts.textContent = postsCount || 0;

  const { count: exchangeCount } = await supabase
    .from('exchange_requests')
    .select('*', { count: 'exact', head: true })
    .or(`recipient_id.eq.${user.id},requester_id.eq.${user.id}`);

  const statExchanges = document.getElementById('stat-exchanges-cnt');
  if (statExchanges) statExchanges.textContent = exchangeCount || 0;

  const { count: savedCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const statSaved = document.getElementById('stat-saved-cnt');
  if (statSaved) statSaved.textContent = savedCount || 0;

  // Level Badge / Founder VIP Badge / Mentee Badge
  const levelBadge = document.getElementById('profile-level-badge');
  if (levelBadge) {
    if (isFounder) {
      levelBadge.className = 'badge-pill badge-amber';
      levelBadge.style.cssText = 'background:#FFF9ED;border:1px solid #F59E0B;color:#916200;font-weight:800;padding:4px 12px;font-size:0.85rem;margin-bottom:8px;display:inline-flex;align-items:center;gap:6px;';
      levelBadge.innerHTML = '<i class="fa-solid fa-crown" style="color:#F59E0B;"></i> Platform Founder & Creator';
    } else if (profile?.user_role === 'mentee') {
      levelBadge.className = 'badge-pill badge-mint';
      levelBadge.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> Mentee & Active Scholar';
    } else if ((postsCount || 0) >= 5) {
      levelBadge.textContent = 'Master Mentor';
    } else if ((postsCount || 0) >= 2) {
      levelBadge.textContent = 'Pro Mentor';
    } else {
      levelBadge.textContent = 'Rising Contributor';
    }
  }

  // Render Achievement Milestone Badges
  const badgesContainer = document.getElementById('profile-achievement-badges');
  if (badgesContainer) {
    badgesContainer.innerHTML = `
      <div class="achievement-badge-card">
        <span class="badge-icon">👑</span>
        <div class="badge-title">${isFounder ? 'Platform Founder' : 'Verified Member'}</div>
      </div>
      <div class="achievement-badge-card">
        <span class="badge-icon">⭐</span>
        <div class="badge-title">5-Star Rating</div>
      </div>
      <div class="achievement-badge-card">
        <span class="badge-icon">⚡</span>
        <div class="badge-title">Rapid Exchanger</div>
      </div>
      <div class="achievement-badge-card">
        <span class="badge-icon">🎓</span>
        <div class="badge-title">${profile?.user_role === 'mentee' ? 'Active Scholar' : 'Master Sensei'}</div>
      </div>`;
  }

  // Auto-populate Founder Project Link Showcase
  if (isFounder && typeof userProjectsStore !== 'undefined' && userProjectsStore.length === 0) {
    userProjectsStore.push({
      url: 'https://github.com/Yashvardhan4646/skill-o-connect',
      title: 'SkillConnect Platform Core',
      desc: 'Official SkillConnect platform codebase built for Viksit Bharat Buildathon 2026.'
    });
    if (typeof renderProjectEmbeds === 'function') renderProjectEmbeds();
  }

  renderProfileTabContent();
}

// ── Load User's Posts ─────────────────────────────────────────
async function loadUserPosts(userId) {
  if (!yourPostsDiv) return;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    yourPostsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">You haven\'t published any skill posts yet.</p>';
    return;
  }

  yourPostsDiv.innerHTML = '';
  data.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post';
    card.innerHTML = `
      <div class="post-content">
        <div class="post-header-row">
          <div class="post-skill-title">${escapeHtml(post.skill)}</div>
          <button class="btn-delete-post" onclick="deletePost('${post.id}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
        <div class="post-badges">
          <span class="badge-pill badge-mint"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(post.location || 'Remote')}</span>
          <span class="badge-pill badge-blue"><i class="fa-solid fa-bolt"></i> ${escapeHtml(post.experience || 'Learner')}</span>
        </div>
        <p class="post-description">${escapeHtml(post.description)}</p>
      </div>`;
    yourPostsDiv.appendChild(card);
  });
}

// ── Load Exchange Requests ────────────────────────────────────
async function loadExchangeRequests(userId) {
  if (!yourPostsDiv) return;

  const { data: requests, error } = await supabase
    .from('exchange_requests')
    .select('*, requester:profiles!exchange_requests_requester_id_fkey(email)')
    .or(`recipient_id.eq.${userId},requester_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error || !requests || requests.length === 0) {
    yourPostsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No skill exchange proposals received yet.</p>';
    return;
  }

  yourPostsDiv.innerHTML = '';
  requests.forEach(req => {
    const isRecipient = req.recipient_id === userId;
    const card = document.createElement('div');
    card.className = 'exchange-card';

    card.innerHTML = `
      <div>
        <div style="font-weight:800;font-size:0.95rem;color:var(--text-primary);">
          <i class="fa-solid fa-handshake"></i> Offer: ${escapeHtml(req.proposed_skill)}
        </div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:2px;">
          ${isRecipient ? `From: ${escapeHtml(req.requester?.email || 'Learner')}` : 'Proposal Sent'}
        </div>
        ${req.message ? `<p style="font-size:0.85rem;margin-top:6px;color:var(--text-secondary);">${escapeHtml(req.message)}</p>` : ''}
      </div>

      <div style="display:flex;gap:8px;align-items:center;">
        <span class="exchange-status-badge status-${req.status}">${req.status.toUpperCase()}</span>
        ${isRecipient && req.status === 'pending' ? `
          <button class="primary" style="padding:4px 10px;font-size:0.78rem;" onclick="respondExchange('${req.id}', 'accepted')">Accept</button>
          <button class="btn-logout" style="padding:4px 10px;font-size:0.78rem;" onclick="respondExchange('${req.id}', 'declined')">Decline</button>
        ` : ''}
      </div>
    `;

    yourPostsDiv.appendChild(card);
  });
}

async function respondExchange(requestId, newStatus) {
  const { error } = await supabase
    .from('exchange_requests')
    .update({ status: newStatus })
    .eq('id', requestId);

  if (error) {
    showToast('Failed to update status: ' + error.message, 'error');
  } else {
    showToast(`Exchange proposal ${newStatus}!`, 'success');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) loadExchangeRequests(user.id);
  }
}

// ── Load Saved Bookmarked Posts ───────────────────────────────
async function loadSavedPosts(userId) {
  if (!yourPostsDiv) return;

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*, post:posts(*, profiles(photo_url, rating))')
    .eq('user_id', userId);

  if (error || !bookmarks || bookmarks.length === 0) {
    yourPostsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No bookmarked skills saved yet.</p>';
    return;
  }

  yourPostsDiv.innerHTML = '';
  bookmarks.forEach(b => {
    const post = b.post;
    if (!post) return;

    const card = document.createElement('div');
    card.className = 'post';
    card.innerHTML = `
      <img src="${escapeHtml(post.profiles?.photo_url || PLACEHOLDER)}" class="post-avatar">
      <div class="post-content">
        <div class="post-header-row">
          <div class="post-skill-title">${escapeHtml(post.skill)}</div>
          <button class="btn-bookmark bookmarked" onclick="toggleBookmark('${post.id}', this)">
            <i class="fa-solid fa-bookmark"></i>
          </button>
        </div>
        <div class="post-badges">
          <span class="badge-pill badge-mint"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(post.location || 'Remote')}</span>
          <span class="badge-pill badge-purple"><i class="fa-solid fa-envelope"></i> ${escapeHtml(post.email)}</span>
        </div>
        <p class="post-description">${escapeHtml(post.description)}</p>
      </div>`;
    yourPostsDiv.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Boot Profile Listener ──────────────────────────────────────
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    loadProfileDashboard(session.user);
  }
});
