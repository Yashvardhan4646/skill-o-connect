console.log('✅ Algorithmic Matchmaking Engine & Endorsements Active');

const postModal      = document.getElementById('postModal');
const postsContainer = document.getElementById('posts');
const openModalBtn   = document.getElementById('openModalBtn');
const postBtn        = document.getElementById('post-btn');
const searchInput    = document.getElementById('feed-search-input');
const sortSelect     = document.getElementById('feed-sort-select');

let allPostsCache      = [];
let userBookmarksSet   = new Set();
let currentFilterTag   = 'all';
let currentSearchQuery = '';
let currentSortMode    = 'newest';
let userLat = null, userLng = null;

// Prevent browser password manager from filling username into search bar
if (searchInput) searchInput.value = '';

// Obtain user GPS for proximity sorting
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;
  }, () => {});
}

// ── Algorithmic Haversine Distance ────────────────────────────
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Smart Matchmaking Scoring Algorithm ───────────────────────
function computeMatchScore(post, currentUser) {
  if (!currentUser) return 85;
  if (post.user_id === currentUser.id) return 0;

  let score = 70;

  if (post.category && post.category !== 'General') score += 12;

  const rating = parseFloat(post.profiles?.rating || '5.0');
  score += (rating - 3) * 5;

  if (userLat && userLng && post.latitude && post.longitude) {
    const dist = calculateDistanceKm(userLat, userLng, post.latitude, post.longitude);
    if (dist < 10) score += 10;
    else if (dist < 30) score += 5;
  }

  return Math.min(98, Math.max(60, Math.round(score)));
}

// ── Algorithmic Content Safety & Spam Validator ───────────────
function validateContentSafety(title, description) {
  if (!title || title.length < 2) {
    return { valid: false, reason: 'Skill title is too short.' };
  }
  if (!description || description.length < 8) {
    return { valid: false, reason: 'Please write a clearer description (at least 8 characters).' };
  }
  const words = description.toLowerCase().split(/\s+/);
  if (words.length > 5 && new Set(words).size === 1) {
    return { valid: false, reason: 'Repetitive spam text detected.' };
  }
  return { valid: true };
}

// ── Open "Share Skill" Modal ──────────────────────────────────
if (openModalBtn) {
  openModalBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (typeof window.requireAuth === 'function') {
        window.requireAuth('share a new skill post');
      } else {
        document.getElementById('loginPopup')?.classList.add('active');
      }
      return;
    }
    postModal.classList.add('active');
  };
}

// ── Close Modal on Outside Click ──────────────────────────────
window.addEventListener('click', (e) => {
  if (e.target === postModal) postModal.classList.remove('active');
  const lp = document.getElementById('loginPopup');
  if (e.target === lp) lp.classList.remove('active');
  const ex = document.getElementById('exchangeModal');
  if (e.target === ex) ex.classList.remove('active');
  const rm = document.getElementById('reviewModal');
  if (e.target === rm) rm.classList.remove('active');
});

// ── Skeleton Loaders ──────────────────────────────────────────
function renderSkeletons() {
  if (!postsContainer) return;
  postsContainer.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line" style="width:40%;"></div>
        <div class="skeleton-line" style="width:25%;"></div>
        <div class="skeleton-line" style="width:90%;"></div>
      </div>
    </div>
  `).join('');
}
renderSkeletons();

// ── Publish Post with Safety Validation & Spinner Lock ────────
if (postBtn) {
  postBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in first.', 'error');

    const skillEl       = document.getElementById('skill');
    const categoryEl    = document.getElementById('skill-category');
    const locationEl    = document.getElementById('location');
    const experienceEl  = document.getElementById('experience');
    const descriptionEl = document.getElementById('description');

    const skill       = skillEl ? skillEl.value.trim() : '';
    const category    = categoryEl ? categoryEl.value : 'General';
    const location    = locationEl ? locationEl.value.trim() : '';
    const experience  = experienceEl ? experienceEl.value.trim() : '';
    const description = descriptionEl ? descriptionEl.value.trim() : '';

    const safety = validateContentSafety(skill, description);
    if (!safety.valid) return showToast(safety.reason, 'error');

    postBtn.disabled = true;
    postBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing Skill Post...';
    [skillEl, categoryEl, locationEl, experienceEl, descriptionEl].forEach(el => {
      if (el) el.disabled = true;
    });

    const resetFormState = () => {
      postBtn.disabled = false;
      postBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Skill Post';
      [skillEl, categoryEl, locationEl, experienceEl, descriptionEl].forEach(el => {
        if (el) el.disabled = false;
      });
    };

    const publish = async (coords = {}) => {
      try {
        const payload = {
          user_id:     user.id,
          email:       user.email,
          skill,
          category:    category || 'General',
          location:    location    || 'Remote',
          experience:  experience  || 'Learner',
          description,
          ...coords
        };

        let { error } = await supabase.from('posts').insert(payload);

        if (error && error.message.includes('category')) {
          delete payload.category;
          const fallbackRes = await supabase.from('posts').insert(payload);
          error = fallbackRes.error;
        }

        if (error) {
          showToast('Failed to publish: ' + error.message, 'error');
        } else {
          showToast('Skill post published successfully! ✨', 'success');
          postModal.classList.remove('active');
          [skillEl, locationEl, experienceEl, descriptionEl].forEach(el => {
            if (el) el.value = '';
          });
        }
      } catch (err) {
        showToast('Unexpected error during publishing.', 'error');
      } finally {
        resetFormState();
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => publish({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        ()  => publish()
      );
    } else {
      publish();
    }
  };
}

// ── Bookmarking Logic ─────────────────────────────────────────
async function toggleBookmark(postId, btn) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return showToast('Please log in to bookmark skills.', 'error');

  const isBookmarked = userBookmarksSet.has(postId);

  if (isBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (!error) {
      userBookmarksSet.delete(postId);
      btn.classList.remove('bookmarked');
      showToast('Bookmark removed.', 'info', 1500);
    }
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, post_id: postId });

    if (!error) {
      userBookmarksSet.add(postId);
      btn.classList.add('bookmarked');
      showToast('Skill bookmarked!', 'success', 1500);
    }
  }
}

// ── Load User Bookmarks ───────────────────────────────────────
async function fetchUserBookmarks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.id);

  if (data) {
    userBookmarksSet = new Set(data.map(b => b.post_id));
  }
}

// ── Delete Post ───────────────────────────────────────────────
async function deletePost(postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return showToast('You must be logged in.', 'error');

  showConfirm('Delete Post', 'Are you sure? This action cannot be undone.', async () => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) showToast('Failed to delete: ' + error.message, 'error');
    else       showToast('Post deleted successfully.', 'info');
  });
}

// ── Live Search & Sorting Listeners ───────────────────────────
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderFilteredPosts();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    currentSortMode = e.target.value;
    renderFilteredPosts();
  });
}

const tagBar = document.getElementById('tag-filter-bar');
if (tagBar) {
  tagBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-tag');
    if (!btn) return;
    document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilterTag = btn.dataset.tag.toLowerCase();
    renderFilteredPosts();
  });
}

// ── Render Filtered & Algorithmic Sorted Posts ───────────────
async function renderFilteredPosts() {
  if (!postsContainer) return;

  const { data: { user } } = await supabase.auth.getUser();

  let filtered = [...allPostsCache];

  // Tag filter
  if (currentFilterTag === 'saved') {
    filtered = filtered.filter(p => userBookmarksSet.has(p.id));
  } else if (currentFilterTag !== 'all') {
    filtered = filtered.filter(p =>
      (p.category && p.category.toLowerCase() === currentFilterTag) ||
      (p.skill && p.skill.toLowerCase().includes(currentFilterTag)) ||
      (p.description && p.description.toLowerCase().includes(currentFilterTag))
    );
  }

  // Search query filter
  if (currentSearchQuery) {
    filtered = filtered.filter(p =>
      (p.skill && p.skill.toLowerCase().includes(currentSearchQuery)) ||
      (p.description && p.description.toLowerCase().includes(currentSearchQuery)) ||
      (p.location && p.location.toLowerCase().includes(currentSearchQuery))
    );
  }

  // Algorithmic Sorting Engine
  if (currentSortMode === 'match') {
    filtered.sort((a, b) => computeMatchScore(b, user) - computeMatchScore(a, user));
  } else if (currentSortMode === 'rating') {
    filtered.sort((a, b) => parseFloat(b.profiles?.rating || '5.0') - parseFloat(a.profiles?.rating || '5.0'));
  } else if (currentSortMode === 'proximity' && userLat && userLng) {
    filtered.sort((a, b) => calculateDistanceKm(userLat, userLng, a.latitude, a.longitude) - calculateDistanceKm(userLat, userLng, b.latitude, b.longitude));
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  renderRecommendationsWidget(allPostsCache, user);

  if (filtered.length === 0) {
    postsContainer.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:var(--text-muted);">
        <i class="fa-solid fa-magnifying-glass" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
        <p style="font-weight:700;font-size:1.1rem;color:var(--text-primary);">No matching skill posts found</p>
        <p style="font-size:0.9rem;">Try searching for a different keyword or selecting another tag filter.</p>
      </div>`;
    return;
  }

  postsContainer.innerHTML = '';

  filtered.forEach(post => {
    const isOwner = user && user.id === post.user_id;
    const isBookmarked = userBookmarksSet.has(post.id);
    const isFounderPost = post.email && post.email.toLowerCase() === 'yashvardhan@atomicmail.io';
    const card = document.createElement('div');
    card.className = 'post';

    const mentorRating = post.profiles?.rating || '5.0';
    const matchPercent = computeMatchScore(post, user);

    card.innerHTML = `
      <a href="profile.html?id=${post.user_id}">
        <img src="${escapeHtml(post.profiles?.photo_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png')}"
             alt="Avatar" class="post-avatar" style="${isFounderPost ? 'border:2px solid #F59E0B;box-shadow:0 0 10px rgba(245,158,11,0.4);' : ''}">
      </a>
      <div class="post-content">
        <div class="post-header-row">
          <a href="post.html?id=${post.id}" class="post-skill-title" style="text-decoration:none;">
            ${escapeHtml(post.skill)}
          </a>
          <div class="post-action-btns">
            <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark('${post.id}', this)" title="Bookmark Skill">
              <i class="fa-solid fa-bookmark"></i>
            </button>
            ${isOwner ? `<button class="btn-delete-post" onclick="deletePost('${post.id}')"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
          </div>
        </div>

        <div class="post-badges">
          ${isFounderPost ? '<span class="badge-pill badge-amber" style="background:#FFF9ED;border:1px solid #F59E0B;color:#916200;font-weight:800;"><i class="fa-solid fa-crown" style="color:#F59E0B;"></i> Platform Founder</span>' : ''}
          <span class="badge-pill badge-purple"><i class="fa-solid fa-bolt"></i> ${matchPercent}% Match</span>
          <span class="badge-pill badge-amber"><i class="fa-solid fa-star"></i> ${mentorRating}</span>
          <span class="badge-pill badge-mint"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(post.location || 'Remote')}</span>
          <a href="profile.html?id=${post.user_id}" style="text-decoration:none;">
            <span class="badge-pill badge-purple"><i class="fa-solid fa-user"></i> ${escapeHtml(post.email || 'Anonymous')}</span>
          </a>
        </div>

        <p class="post-description">${escapeHtml(post.description)}</p>

        <div class="post-footer-actions">
          <a href="post.html?id=${post.id}" class="btn-secondary" style="font-size:0.8rem;padding:4px 10px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-up-right-from-square"></i> Details & Comments
          </a>

          ${!isOwner ? `
            <button class="btn-secondary" style="font-size:0.8rem;padding:4px 10px;display:inline-flex;align-items:center;gap:6px;" onclick="endorseSkill('${post.id}', '${post.user_id}', this)">
              <i class="fa-solid fa-thumbs-up"></i> Endorse
            </button>
            <button class="btn-secondary" style="font-size:0.8rem;padding:4px 10px;display:inline-flex;align-items:center;gap:6px;" onclick="openDirectChatWithUser('${post.user_id}', '${escapeHtml(post.email)}')">
              <i class="fa-solid fa-comments"></i> Send DM
            </button>
            <button class="btn-request-exchange" onclick="openExchangeModal('${post.id}', '${post.user_id}', '${escapeHtml(post.skill)}')">
              <i class="fa-solid fa-handshake"></i> Request Exchange
            </button>
            <button class="btn-review-mentor" onclick="openReviewModal('${post.user_id}', '${escapeHtml(post.email)}')">
              <i class="fa-solid fa-star"></i> Rate Mentor
            </button>
          ` : '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:700;"><i class="fa-solid fa-user-check"></i> Your Shared Skill Post</span>'}
        </div>
      </div>`;

    postsContainer.appendChild(card);
  });
}

// ── Render Matchmaking Recommendations Carousel Widget ────────
function renderRecommendationsWidget(posts, user) {
  const widget = document.getElementById('smart-recommendations-widget');
  const container = document.getElementById('smart-matches-container');
  if (!widget || !container) return;

  const topMatches = [...posts]
    .filter(p => !user || p.user_id !== user.id)
    .sort((a, b) => computeMatchScore(b, user) - computeMatchScore(a, user))
    .slice(0, 4);

  if (topMatches.length === 0) {
    widget.style.display = 'none';
    return;
  }

  widget.style.display = 'block';
  container.innerHTML = '';

  topMatches.forEach(p => {
    const matchPct = computeMatchScore(p, user);
    const item = document.createElement('div');
    item.style.cssText = `
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      min-width: 220px;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    `;
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-weight:800;font-size:0.88rem;color:var(--text-primary);">${escapeHtml(p.skill)}</span>
        <span class="badge-pill badge-purple" style="font-size:0.7rem;">⚡ ${matchPct}%</span>
      </div>
      <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:6px;">📍 ${escapeHtml(p.location || 'Remote')}</div>
      <a href="post.html?id=${p.id}" class="btn-secondary" style="font-size:0.75rem;padding:3px 8px;display:block;text-align:center;text-decoration:none;">View Match</a>
    `;
    container.appendChild(item);
  });
}

// ── Modal Handlers ────────────────────────────────────────────
let activeExchangePostId = null;
let activeExchangeRecipientId = null;

async function openExchangeModal(postId, recipientId, skillName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (typeof window.requireAuth === 'function') {
      window.requireAuth('request a skill exchange');
    } else {
      document.getElementById('loginPopup')?.classList.add('active');
    }
    return;
  }

  activeExchangePostId = postId;
  activeExchangeRecipientId = recipientId;

  document.getElementById('exchange-modal-subtitle').textContent = `Propose a mutual skill session for "${skillName}".`;
  document.getElementById('exchangeModal').classList.add('active');
}

const submitExchangeBtn = document.getElementById('submit-exchange-btn');
if (submitExchangeBtn) {
  submitExchangeBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in first.', 'error');

    const offerEl = document.getElementById('exchange-skill-offer');
    const msgEl   = document.getElementById('exchange-message');
    const proposedSkill = offerEl ? offerEl.value.trim() : '';
    const message       = msgEl ? msgEl.value.trim() : '';

    if (!proposedSkill) return showToast('Please enter a skill you can offer in return.', 'error');

    submitExchangeBtn.disabled = true;
    submitExchangeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Proposal...';

    try {
      const { error } = await supabase.from('exchange_requests').insert({
        requester_id: user.id,
        recipient_id: activeExchangeRecipientId,
        post_id: activeExchangePostId,
        proposed_skill: proposedSkill,
        message,
        status: 'pending'
      });

      if (error) {
        showToast('Failed to send proposal: ' + error.message, 'error');
      } else {
        showToast('Skill exchange proposal sent successfully! ✨', 'success');
        document.getElementById('exchangeModal').classList.remove('active');
        if (offerEl) offerEl.value = '';
        if (msgEl) msgEl.value = '';
      }
    } finally {
      submitExchangeBtn.disabled = false;
      submitExchangeBtn.innerHTML = '<i class="fa-solid fa-handshake"></i> Send Exchange Proposal';
    }
  };
}

let activeMentorId = null;
async function openReviewModal(mentorId, mentorEmail) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (typeof window.requireAuth === 'function') {
      window.requireAuth('rate and review a mentor');
    } else {
      document.getElementById('loginPopup')?.classList.add('active');
    }
    return;
  }
  if (user.id === mentorId) return showToast('You cannot review yourself.', 'info');

  activeMentorId = mentorId;
  document.getElementById('review-modal-subtitle').textContent = `Leave a review for ${mentorEmail}.`;
  document.getElementById('reviewModal').classList.add('active');
}

const submitReviewBtn = document.getElementById('submit-review-btn');
if (submitReviewBtn) {
  submitReviewBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in first.', 'error');

    const commentEl = document.getElementById('review-comment');
    const comment   = commentEl ? commentEl.value.trim() : '';

    submitReviewBtn.disabled = true;
    submitReviewBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Review...';

    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_id: user.id,
        mentor_id: activeMentorId,
        rating: currentSelectedRating,
        comment
      });

      if (error) {
        showToast('Failed to submit review: ' + error.message, 'error');
      } else {
        showToast('Thank you! Your mentor review has been submitted.', 'success');
        document.getElementById('reviewModal').classList.remove('active');
        if (commentEl) commentEl.value = '';
        loadPosts();
      }
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.innerHTML = '<i class="fa-solid fa-star"></i> Submit Review';
    }
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Ultra-Safe Posts Fetching ───────────────────────────────────
async function loadPosts() {
  if (searchInput) searchInput.value = '';
  renderSkeletons();
  await fetchUserBookmarks();

  let { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(photo_url)')
    .order('created_at', { ascending: false });

  if (error || !posts) {
    const { data: rawPosts, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postErr) {
      showToast('Failed to load posts: ' + postErr.message, 'error');
      postsContainer.innerHTML = '';
      return;
    }

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

  allPostsCache = posts || [];
  renderFilteredPosts();
}

supabase.channel('public:posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts())
  .subscribe();

loadPosts();
