console.log("✅ UI, Notifications, Calendar & Challenges Systems Active");

// === TOAST NOTIFICATION SYSTEM ===
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error: '<i class="fa-solid fa-circle-exclamation"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '<i class="fa-solid fa-circle-info"></i>'}</span>
    <span class="toast-message">${message}</span>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === CUSTOM CONFIRMATION MODAL SYSTEM ===
function showConfirm(title, message, onConfirm) {
  let confirmModal = document.getElementById('confirmModal');
  if (!confirmModal) {
    confirmModal = document.createElement('div');
    confirmModal.id = 'confirmModal';
    confirmModal.className = 'modal';
    confirmModal.innerHTML = `
      <div class="modal-content confirm-box">
        <h4 id="confirmTitle">${title}</h4>
        <p id="confirmMessage">${message}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" id="confirmCancelBtn">Cancel</button>
          <button class="primary" id="confirmOkBtn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModal);
  } else {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
  }

  confirmModal.classList.add('active');

  const cleanup = () => {
    confirmModal.classList.remove('active');
  };

  document.getElementById('confirmCancelBtn').onclick = cleanup;
  document.getElementById('confirmOkBtn').onclick = () => {
    cleanup();
    if (typeof onConfirm === 'function') onConfirm();
  };
}

// === STAR RATING PICKER LOGIC ===
let currentSelectedRating = 5;
const starPicker = document.getElementById('star-picker');
if (starPicker) {
  starPicker.addEventListener('click', (e) => {
    const star = e.target.closest('i');
    if (!star) return;
    const val = parseInt(star.dataset.val);
    currentSelectedRating = val;

    const stars = starPicker.querySelectorAll('i');
    stars.forEach((s, idx) => {
      if (idx < val) s.classList.add('selected');
      else s.classList.remove('selected');
    });
  });
}

// === TAB NAVIGATION SYSTEM (7 Tabs) ===
const feed = document.getElementById('feed-section');
const dm = document.getElementById('dm-section');
const profile = document.getElementById('profile-section');
const mapSection = document.getElementById('map-section');
const leaderboardSection = document.getElementById('leaderboard-section');
const scheduleSection = document.getElementById('schedule-section');
const challengesSection = document.getElementById('challenges-section');

const setActiveNav = (id) => {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
};

const navFeed = document.getElementById('nav-feed');
const navMessages = document.getElementById('nav-messages');
const navProfile = document.getElementById('nav-profile');
const navMap = document.getElementById('nav-map');
const navLeaderboard = document.getElementById('nav-leaderboard');
const navSchedule = document.getElementById('nav-schedule');
const navChallenges = document.getElementById('nav-challenges');

function hideAllSections() {
  if (feed) feed.style.display = 'none';
  if (dm) dm.style.display = 'none';
  if (profile) profile.style.display = 'none';
  if (mapSection) mapSection.style.display = 'none';
  if (leaderboardSection) leaderboardSection.style.display = 'none';
  if (scheduleSection) scheduleSection.style.display = 'none';
  if (challengesSection) challengesSection.style.display = 'none';
}

async function checkAuthGuard(reason) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (typeof window.requireAuth === 'function') {
      window.requireAuth(reason);
    } else {
      document.getElementById('loginPopup')?.classList.add('active');
    }
    return false;
  }
  return true;
}

if (navFeed) {
  navFeed.onclick = () => {
    hideAllSections();
    if (feed) feed.style.display = 'block';
    setActiveNav('nav-feed');
  };
}

if (navMessages) {
  navMessages.onclick = async () => {
    if (!(await checkAuthGuard('view your Direct Messages inbox'))) return;
    hideAllSections();
    if (dm) dm.style.display = 'block';
    setActiveNav('nav-messages');
  };
}

if (navProfile) {
  navProfile.onclick = async () => {
    if (!(await checkAuthGuard('view your Profile & Dashboard'))) return;
    hideAllSections();
    if (profile) profile.style.display = 'block';
    setActiveNav('nav-profile');
    renderProjectEmbeds();
  };
}

if (navMap) {
  navMap.onclick = () => {
    hideAllSections();
    if (mapSection) mapSection.style.display = 'block';
    setActiveNav('nav-map');
  };
}

if (navLeaderboard) {
  navLeaderboard.onclick = () => {
    hideAllSections();
    if (leaderboardSection) leaderboardSection.style.display = 'block';
    setActiveNav('nav-leaderboard');
    loadLeaderboardData();
  };
}

if (navSchedule) {
  navSchedule.onclick = async () => {
    if (!(await checkAuthGuard('view your Scheduled Sessions'))) return;
    hideAllSections();
    if (scheduleSection) scheduleSection.style.display = 'block';
    setActiveNav('nav-schedule');
    loadScheduledSessions();
  };
}

if (navChallenges) {
  navChallenges.onclick = () => {
    hideAllSections();
    if (challengesSection) challengesSection.style.display = 'block';
    setActiveNav('nav-challenges');
    renderChallengesBoard();
  };
}

// ── QUICK SKILL MATCH QUIZ MODAL LOGIC ────────────────────────
let selectedQuizDomain = 'coding';

function openMatchQuizModal() {
  document.getElementById('matchQuizModal')?.classList.add('active');
}

function selectQuizChoice(type, value, btn) {
  if (type === 'domain') {
    selectedQuizDomain = value;
    document.querySelectorAll('#quiz-step-1 .quiz-choice-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }
}

function executeQuizMatch() {
  document.getElementById('matchQuizModal')?.classList.remove('active');
  showToast(`Filtering top ${selectedQuizDomain.toUpperCase()} mentor matches... ⚡`, 'success');

  const sortEl = document.getElementById('feed-sort-select');
  if (sortEl) sortEl.value = 'match';

  const tagBar = document.getElementById('tag-filter-bar');
  if (tagBar) {
    const targetBtn = tagBar.querySelector(`[data-tag="${selectedQuizDomain}"]`);
    if (targetBtn) targetBtn.click();
  }
}

// ── FULLY FUNCTIONAL COMMUNITY SKILL CHALLENGES BOARD ──────────
function openCreateChallengeModal() {
  document.getElementById('challengeModal')?.classList.add('active');
}

const publishChallengeBtn = document.getElementById('publish-challenge-btn');
if (publishChallengeBtn) {
  publishChallengeBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in to post a challenge.', 'error');

    const titleEl = document.getElementById('challenge-title-input');
    const catEl   = document.getElementById('challenge-category-input');
    const spotsEl = document.getElementById('challenge-spots-input');
    const descEl  = document.getElementById('challenge-desc-input');

    const title       = titleEl ? titleEl.value.trim() : '';
    const category    = catEl ? catEl.value : 'Coding';
    const spots_left  = spotsEl ? parseInt(spotsEl.value) || 4 : 4;
    const description = descEl ? descEl.value.trim() : '';

    if (!title || !description) {
      return showToast('Please fill in both title and description.', 'error');
    }

    publishChallengeBtn.disabled = true;
    publishChallengeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

    const { error } = await supabase.from('challenges').insert({
      title,
      category,
      description,
      spots_left,
      created_by: user.id,
      creator_email: user.email
    });

    publishChallengeBtn.disabled = false;
    publishChallengeBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Publish Challenge';

    if (error) {
      showToast('Failed to publish challenge: ' + error.message, 'error');
    } else {
      showToast('Buildathon challenge published! 🚀', 'success');
      document.getElementById('challengeModal')?.classList.remove('active');
      if (titleEl) titleEl.value = '';
      if (descEl) descEl.value = '';
      renderChallengesBoard();
    }
  };
}

async function renderChallengesBoard() {
  const container = document.getElementById('challenges-container');
  if (!container) return;

  container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">Loading challenges...</div>';

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !challenges || challenges.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-muted);">
        <i class="fa-solid fa-rocket" style="font-size:2rem;margin-bottom:8px;display:block;"></i>
        <p style="font-weight:700;font-size:1rem;color:var(--text-primary);">No active buildathon challenges posted yet</p>
        <p style="font-size:0.88rem;">Click "+ Post Challenge" above to create the first community challenge!</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  challenges.forEach(c => {
    const card = document.createElement('div');
    card.className = 'challenge-card';
    card.innerHTML = `
      <div class="challenge-header-row">
        <span class="challenge-title">${escapeHtml(c.title)}</span>
        <span class="badge-pill badge-purple">${escapeHtml(c.category || 'General')}</span>
      </div>
      <p class="challenge-desc">${escapeHtml(c.description)}</p>
      <div class="challenge-footer">
        <span style="font-size:0.8rem;font-weight:700;color:var(--accent-mint-dark);"><i class="fa-solid fa-users"></i> ${c.spots_left || 4} Spots Left</span>
        <button class="primary" style="padding:6px 12px;font-size:0.8rem;" onclick="joinChallengeTeam('${c.id}', '${escapeHtml(c.title)}')">
          <i class="fa-solid fa-user-plus"></i> Join Challenge Team
        </button>
      </div>`;
    container.appendChild(card);
  });
}

async function joinChallengeTeam(challengeId, title) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    document.getElementById('loginPopup')?.classList.add('active');
    return showToast('Please log in to join a challenge team.', 'error');
  }

  const { error } = await supabase.from('challenge_members').insert({
    challenge_id: challengeId,
    user_id: user.id,
    email: user.email
  });

  if (error && error.message.includes('unique')) {
    return showToast('You are already a member of this challenge team!', 'info');
  } else if (error) {
    return showToast('Failed to join challenge: ' + error.message, 'error');
  }

  showToast(`Successfully joined "${title}" buildathon team! 🚀`, 'success');
  renderChallengesBoard();
}

// ── TOPBAR NOTIFICATION DROPDOWN CENTER ───────────────────────
const notifBellBtn  = document.getElementById('notif-bell-btn');
const notifDropdown = document.getElementById('notif-dropdown-menu');
const notifBadge    = document.getElementById('notif-count-badge');
const notifList     = document.getElementById('notif-list');
let notificationsCache = [];

if (notifBellBtn) {
  notifBellBtn.onclick = (e) => {
    e.stopPropagation();
    const isVisible = notifDropdown.style.display === 'block';
    notifDropdown.style.display = isVisible ? 'none' : 'block';
  };
}

document.addEventListener('click', (e) => {
  if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBellBtn) {
    notifDropdown.style.display = 'none';
  }
});

async function loadNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !notifList) return;

  const { data: pendingRequests } = await supabase
    .from('exchange_requests')
    .select('*, posts(skill)')
    .eq('recipient_id', user.id)
    .eq('status', 'pending');

  notificationsCache = (pendingRequests || []).map(r => ({
    id: r.id,
    title: 'New Exchange Proposal',
    message: `Proposal for "${r.posts?.skill || 'Skill'}" offering "${r.proposed_skill}"`,
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  if (notificationsCache.length > 0) {
    notifBadge.style.display = 'flex';
    notifBadge.textContent = notificationsCache.length;
    notifList.innerHTML = notificationsCache.map(n => `
      <div class="notif-item unread">
        <div style="font-weight:800;color:var(--primary);">${escapeHtml(n.title)}</div>
        <div style="color:var(--text-secondary);">${escapeHtml(n.message)}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${n.time}</div>
      </div>
    `).join('');
  } else {
    notifBadge.style.display = 'none';
    notifList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No new notifications</div>';
  }
}

function clearNotifications() {
  notificationsCache = [];
  if (notifBadge) notifBadge.style.display = 'none';
  if (notifList) notifList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Notifications cleared</div>';
}

// ── PEER SKILL ENDORSEMENTS SYSTEM ────────────────────────────
const endorsedSkillsSet = new Set();

async function endorseSkill(postId, mentorId, btn) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    document.getElementById('loginPopup')?.classList.add('active');
    return showToast('Please log in to endorse mentors.', 'error');
  }

  if (user.id === mentorId) return showToast('You cannot endorse your own post.', 'info');

  if (endorsedSkillsSet.has(postId)) {
    return showToast('You have already endorsed this skill.', 'info');
  }

  endorsedSkillsSet.add(postId);
  btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> Endorsed`;
  btn.classList.add('active');
  showToast('Skill endorsed! 👍', 'success');
}

// ── MENTOR PROJECT LINK EMBED SHOWCASE ─────────────────────────
let userProjectsStore = [];

function openAddProjectLinkModal() {
  document.getElementById('projectLinkModal')?.classList.add('active');
}

const saveProjectBtn = document.getElementById('save-project-link-btn');
if (saveProjectBtn) {
  saveProjectBtn.onclick = () => {
    const urlEl   = document.getElementById('project-url-input');
    const titleEl = document.getElementById('project-title-input');
    const descEl  = document.getElementById('project-desc-input');

    const url   = urlEl ? urlEl.value.trim() : '';
    const title = titleEl ? titleEl.value.trim() : 'Project Showcase';
    const desc  = descEl ? descEl.value.trim() : 'Live interactive project link.';

    if (!url || !url.startsWith('http')) {
      return showToast('Please enter a valid HTTP/HTTPS project link.', 'error');
    }

    userProjectsStore.push({ url, title, desc });
    renderProjectEmbeds();

    document.getElementById('projectLinkModal')?.classList.remove('active');
    if (urlEl) urlEl.value = '';
    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';

    showToast('Project embedded into showcase card! 🚀', 'success');
  };
}

function renderProjectEmbeds() {
  const container = document.getElementById('project-embeds-grid');
  if (!container) return;

  if (userProjectsStore.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:0.85rem;">No project link embeds added yet. Click "+ Add Project Link" above to embed your work!</div>';
    return;
  }

  container.innerHTML = '';
  userProjectsStore.forEach(proj => {
    const domain = new URL(proj.url).hostname;
    const card = document.createElement('div');
    card.className = 'project-embed-card';

    card.innerHTML = `
      <div class="project-embed-banner">
        <div style="text-align:center;color:var(--primary-hover);">
          <i class="fa-solid fa-globe" style="font-size:2.2rem;margin-bottom:4px;display:block;"></i>
          <span style="font-size:0.75rem;font-weight:800;text-transform:uppercase;">${escapeHtml(domain)}</span>
        </div>
      </div>
      <div class="project-embed-title">${escapeHtml(proj.title)}</div>
      <div class="project-embed-desc">${escapeHtml(proj.desc)}</div>
      <a href="${escapeHtml(proj.url)}" target="_blank" rel="noopener" class="btn-secondary" style="display:block;text-align:center;font-size:0.78rem;padding:5px 10px;text-decoration:none;margin-top:auto;">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Embedded Project
      </a>`;

    container.appendChild(card);
  });
}

// ── LEADERBOARD DATA LOADER (FILTERING OUT MENTEE-ONLY PROFILES) ─
async function loadLeaderboardData() {
  const tableContainer = document.getElementById('leaderboard-table-container');
  if (!tableContainer) return;

  tableContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">Loading standings...</div>';

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(30);

  if (error || !profiles || profiles.length === 0) {
    tableContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No leaderboard standings available yet.</div>';
    return;
  }

  const mentorProfiles = profiles.filter(p => p.user_role !== 'mentee');

  if (mentorProfiles.length === 0) {
    tableContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No mentor standings available yet.</div>';
    return;
  }

  const goldEl = document.getElementById('lead-gold-name');
  const silverEl = document.getElementById('lead-silver-name');
  const bronzeEl = document.getElementById('lead-bronze-name');

  if (goldEl && mentorProfiles[0]) goldEl.textContent = mentorProfiles[0].email;
  if (silverEl && mentorProfiles[1]) silverEl.textContent = mentorProfiles[1].email;
  if (bronzeEl && mentorProfiles[2]) bronzeEl.textContent = mentorProfiles[2].email;

  tableContainer.innerHTML = `
    <table style="width:100%;border-collapse:collapse;background:var(--bg-surface);border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border-color);">
      <thead>
        <tr style="background:var(--bg-subtle);border-bottom:1px solid var(--border-color);text-align:left;font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">
          <th style="padding:12px 16px;">Rank</th>
          <th style="padding:12px 16px;">Mentor Member</th>
          <th style="padding:12px 16px;">Rating</th>
          <th style="padding:12px 16px;">Badge Tier</th>
        </tr>
      </thead>
      <tbody>
        ${mentorProfiles.map((p, idx) => `
          <tr style="border-bottom:1px solid var(--border-color);font-size:0.88rem;">
            <td style="padding:12px 16px;font-weight:800;">
              ${idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
            </td>
            <td style="padding:12px 16px;font-weight:700;">
              <a href="profile.html?id=${p.id}" style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:10px;">
                <img src="${p.photo_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}" style="width:30px;height:30px;border-radius:var(--radius-md);object-fit:cover;">
                <span>${escapeHtml(p.email)}</span>
              </a>
            </td>
            <td style="padding:12px 16px;color:#F59E0B;font-weight:800;">
              ★ ${p.rating || '5.0'}
            </td>
            <td style="padding:12px 16px;">
              <span class="badge-pill ${idx === 0 ? 'badge-amber' : idx < 3 ? 'badge-purple' : 'badge-mint'}">
                ${idx === 0 ? 'Master Sensei' : idx < 3 ? 'Community Pillar' : 'Rising Scholar'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

// ── SCHEDULED SESSIONS DATA LOADER & CALENDAR TRACKER ─────────
async function loadScheduledSessions() {
  const container = document.getElementById('scheduled-sessions-list');
  const calendarWidget = document.getElementById('session-calendar-widget');

  if (!container) return;

  container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">Loading sessions...</div>';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        Please log in to view your scheduled skill sessions.
      </div>`;
    return;
  }

  const { data: requests, error } = await supabase
    .from('exchange_requests')
    .select('*, posts(skill, location)')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'accepted');

  if (error || !requests || requests.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <i class="fa-regular fa-calendar-xmark" style="font-size:2rem;margin-bottom:8px;display:block;"></i>
        <p style="font-weight:700;font-size:1rem;color:var(--text-primary);">No active accepted sessions yet</p>
        <p style="font-size:0.88rem;">When an exchange proposal is accepted, it will appear here with scheduling details.</p>
      </div>`;
    if (calendarWidget) calendarWidget.style.display = 'none';
    return;
  }

  if (calendarWidget) {
    calendarWidget.style.display = 'grid';
    calendarWidget.innerHTML = requests.slice(0, 3).map((r, i) => `
      <div class="calendar-day-box">
        <div style="font-size:0.75rem;font-weight:800;color:var(--primary);text-transform:uppercase;">Upcoming Session #${i + 1}</div>
        <div style="font-size:0.95rem;font-weight:800;margin-top:2px;">${escapeHtml(r.proposed_skill)}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;"><i class="fa-solid fa-clock"></i> Scheduled 1-on-1 Session</div>
      </div>
    `).join('');
  }

  container.innerHTML = '';
  requests.forEach(req => {
    const isRequester = req.requester_id === user.id;
    const partnerId = isRequester ? req.recipient_id : req.requester_id;

    const card = document.createElement('div');
    card.className = 'exchange-card';
    card.innerHTML = `
      <div>
        <div style="font-weight:800;font-size:1.05rem;color:var(--text-primary);">
          <i class="fa-solid fa-handshake" style="color:var(--accent-mint-dark);"></i> Exchange: ${escapeHtml(req.proposed_skill)}
        </div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">
          Skill Target: <strong>${escapeHtml(req.posts?.skill || 'Skill Session')}</strong>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
          Status: <span class="exchange-status-badge status-accepted">ACCEPTED & SCHEDULED</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" style="font-size:0.8rem;padding:6px 12px;" onclick="openDirectChatWithUser('${partnerId}', 'Exchange Partner')">
          <i class="fa-solid fa-comments"></i> Chat Partner
        </button>
      </div>`;
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// === DARK MODE TOGGLE & PERSISTENCE ===
const darkToggle = document.getElementById('dark-toggle');

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (darkToggle) darkToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove('dark');
    if (darkToggle) darkToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
};

if (darkToggle) {
  darkToggle.onclick = () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    darkToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info', 1500);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadNotifications();
  renderProjectEmbeds();
  renderChallengesBoard();
});
