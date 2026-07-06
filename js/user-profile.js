console.log('✅ Standalone Public User Profile Controller active (Editable Learning Goals System)');

const profileHeader = document.getElementById('public-profile-header');
const projectGrid   = document.getElementById('public-project-embeds');
const userPostsDiv  = document.getElementById('public-user-posts');
const reviewsDiv    = document.getElementById('public-user-reviews');

const PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

async function initPublicUserProfile() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  const userEmail = params.get('email');

  if (!userId && !userEmail) {
    if (profileHeader) {
      profileHeader.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-muted);">
          <i class="fa-solid fa-user-slash" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
          <h3>No User Specified</h3>
          <p>Invalid user link.</p>
        </div>`;
    }
    return;
  }

  let query = supabase.from('profiles').select('*');
  if (userId) query = query.eq('id', userId);
  else query = query.eq('email', userEmail);

  const { data: profile, error } = await query.maybeSingle();

  if (error || !profile) {
    if (profileHeader) {
      profileHeader.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-muted);">
          <i class="fa-solid fa-user-slash" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
          <h3>User Profile Not Found</h3>
          <p>This member profile could not be retrieved.</p>
        </div>`;
    }
    return;
  }

  renderHeader(profile);

  if (profile.user_role === 'mentee') {
    renderMenteeLearningGoals(profile);
  } else {
    renderUserPosts(profile.id);
  }

  renderUserReviews(profile);
  renderUserProjectEmbeds(profile.email);
}

function renderHeader(profile) {
  if (!profileHeader) return;

  const isFounder = profile.email && profile.email.toLowerCase() === 'yashvardhan@atomicmail.io';
  const isMentee  = profile.user_role === 'mentee';

  document.title = `${profile.email} (${isMentee ? 'Mentee' : 'Mentor'}) Profile | SkillConnect`;

  profileHeader.innerHTML = `
    <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap;">
      <img src="${escapeHtml(profile.photo_url || PLACEHOLDER)}" alt="Avatar"
           style="width:84px;height:84px;border-radius:var(--radius-md);object-fit:cover;${isFounder ? 'border:3px solid #F59E0B;box-shadow:0 0 16px rgba(245,158,11,0.45);' : 'border:2px solid var(--border-color);'}">

      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">${escapeHtml(profile.email)}</h2>
          ${isFounder ? '<span class="badge-pill badge-amber" style="background:#FFF9ED;border:1px solid #F59E0B;color:#916200;font-weight:800;padding:4px 12px;font-size:0.82rem;"><i class="fa-solid fa-crown" style="color:#F59E0B;"></i> Platform Founder & Creator</span>'
            : isMentee ? '<span class="badge-pill badge-mint" style="background:var(--accent-mint-tint);border:1px solid var(--accent-mint);color:var(--accent-mint-dark);font-weight:800;padding:4px 12px;font-size:0.82rem;"><i class="fa-solid fa-graduation-cap"></i> Mentee & Active Scholar</span>'
            : '<span class="badge-pill badge-purple">Community Mentor</span>'}
        </div>

        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:6px;">
          ${isMentee ? `
            <span style="font-weight:800;color:var(--accent-blue);font-size:0.95rem;"><i class="fa-solid fa-rocket"></i> Learning Explorer</span>
            <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="fa-solid fa-book-open"></i> Seeking Mentorship</span>
          ` : `
            <span style="font-weight:800;color:#F59E0B;font-size:1rem;">★ ${profile.rating || '5.00'} Rating</span>
            <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="fa-solid fa-comment-dots"></i> ${profile.reviews_cnt || 0} Peer Reviews</span>
          `}
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="primary" onclick="openDirectChatWithUser('${profile.id}', '${escapeHtml(profile.email)}')">
          <i class="fa-solid fa-comments"></i> Send DM
        </button>

        ${isMentee ? `
          <button class="btn-secondary" style="padding:10px 18px;font-size:0.9rem;" onclick="offerMentorshipToMentee('${profile.id}', '${escapeHtml(profile.email)}')">
            <i class="fa-solid fa-graduation-cap"></i> Offer Mentorship
          </button>
        ` : `
          <button class="btn-review-mentor" style="padding:10px 18px;font-size:0.9rem;" onclick="openReviewModal('${profile.id}', '${escapeHtml(profile.email)}')">
            <i class="fa-solid fa-star"></i> Rate Mentor
          </button>
        `}
      </div>
    </div>`;
}

// ── Mentee Learning Goals & Wishlist View ───────────────────────
function renderMenteeLearningGoals(profile) {
  if (!userPostsDiv) return;

  const goalsText = profile.learning_goals || 'No specific learning goals detailed yet.';

  userPostsDiv.innerHTML = `
    <div style="background:var(--bg-surface);border:1px solid var(--border-color);padding:20px;border-radius:var(--radius-md);">
      <h4 style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fa-solid fa-graduation-cap" style="color:var(--primary);"></i> Mentee Learning Wishlist & Objectives
      </h4>
      <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:14px;">
        This community member is registered as a <strong>Mentee</strong> actively seeking 1-on-1 guidance, code reviews, and structured learning sessions.
      </p>

      <div style="background:var(--bg-subtle);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">
        <div style="font-weight:800;font-size:0.85rem;color:var(--primary-hover);margin-bottom:4px;"><i class="fa-solid fa-bullseye"></i> Saved Learning Goals & Targets:</div>
        <div style="font-size:0.9rem;font-weight:600;color:var(--text-primary);white-space:pre-wrap;line-height:1.5;">${escapeHtml(goalsText)}</div>
      </div>
    </div>`;
}

function offerMentorshipToMentee(userId, email) {
  openDirectChatWithUser(userId, email);
  showToast(`Initiating direct conversation with learner ${email}...`, 'info');
}

async function renderUserPosts(userId) {
  if (!userPostsDiv) return;

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !posts || posts.length === 0) {
    userPostsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">This mentor has not published any skill posts yet.</p>';
    return;
  }

  userPostsDiv.innerHTML = '';
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post';
    card.innerHTML = `
      <div class="post-content">
        <div class="post-header-row">
          <a href="post.html?id=${post.id}" class="post-skill-title" style="text-decoration:none;">${escapeHtml(post.skill)}</a>
        </div>
        <div class="post-badges">
          <span class="badge-pill badge-mint"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(post.location || 'Remote')}</span>
          <span class="badge-pill badge-blue"><i class="fa-solid fa-bolt"></i> ${escapeHtml(post.experience || 'Learner')}</span>
        </div>
        <p class="post-description">${escapeHtml(post.description)}</p>
        <div class="post-footer-actions">
          <a href="post.html?id=${post.id}" class="btn-secondary" style="font-size:0.8rem;padding:4px 10px;text-decoration:none;">
            <i class="fa-solid fa-up-right-from-square"></i> Details & Comments
          </a>
          <button class="btn-request-exchange" onclick="openExchangeModal('${post.id}', '${post.user_id}', '${escapeHtml(post.skill)}')">
            <i class="fa-solid fa-handshake"></i> Request Exchange
          </button>
        </div>
      </div>`;
    userPostsDiv.appendChild(card);
  });
}

async function renderUserReviews(profile) {
  if (!reviewsDiv) return;

  if (profile.user_role === 'mentee') {
    reviewsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">Mentee accounts focus on learning rather than mentor reviews.</p>';
    return;
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_reviewer_id_fkey(email, photo_url)')
    .eq('mentor_id', profile.id)
    .order('created_at', { ascending: false });

  if (error || !reviews || reviews.length === 0) {
    reviewsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No peer reviews submitted for this mentor yet.</p>';
    return;
  }

  reviewsDiv.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-surface);border:1px solid var(--border-color);padding:14px;border-radius:var(--radius-md);margin-bottom:10px;';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:700;font-size:0.88rem;">${escapeHtml(r.reviewer?.email || 'Anonymous Learner')}</span>
        <span style="color:#F59E0B;font-weight:800;">★ ${r.rating} / 5</span>
      </div>
      <p style="font-size:0.88rem;color:var(--text-secondary);">${escapeHtml(r.comment || 'Great session!')}</p>`;
    reviewsDiv.appendChild(card);
  });
}

function renderUserProjectEmbeds(email) {
  if (!projectGrid) return;

  const isFounder = email && email.toLowerCase() === 'yashvardhan@atomicmail.io';

  if (isFounder) {
    projectGrid.innerHTML = `
      <div class="project-embed-card">
        <div class="project-embed-banner">
          <div style="text-align:center;color:var(--primary-hover);">
            <i class="fa-solid fa-code-fork" style="font-size:2.2rem;margin-bottom:4px;display:block;"></i>
            <span style="font-size:0.75rem;font-weight:800;">GITHUB.COM</span>
          </div>
        </div>
        <div class="project-embed-title">SkillConnect Core Platform</div>
        <div class="project-embed-desc">Official SkillConnect repository built for Viksit Bharat Buildathon 2026.</div>
        <a href="https://github.com/Yashvardhan4646/skill-o-connect" target="_blank" rel="noopener" class="btn-secondary" style="display:block;text-align:center;font-size:0.78rem;padding:5px 10px;text-decoration:none;margin-top:auto;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Founder Repository
        </a>
      </div>`;
  } else {
    projectGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No project link embeds added yet.</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', initPublicUserProfile);
