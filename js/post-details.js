console.log('✅ Post Details & Comments script loaded');

const urlParams    = new URLSearchParams(window.location.search);
const postId       = urlParams.get('id');

const postDetailsContainer = document.getElementById('post-details-container');
const commentsListContainer = document.getElementById('comments-list');
const commentsTitleCount   = document.getElementById('comments-title-count');
const commentInput         = document.getElementById('comment-text-input');
const submitCommentBtn     = document.getElementById('submit-comment-btn');

let currentPostData = null;

if (!postId) {
  if (postDetailsContainer) {
    postDetailsContainer.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:var(--accent-rose-dark);margin-bottom:10px;"></i>
        <h3>No Post ID Specified</h3>
        <p><a href="main.html">Return to Discover Feed</a></p>
      </div>`;
  }
} else {
  loadPostDetails();
  loadPostComments();
  subscribeToCommentsRealtime();
}

// ── Load Post Details ─────────────────────────────────────────
async function loadPostDetails() {
  if (!postDetailsContainer) return;

  // Try standard join
  let { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(photo_url, rating, reviews_cnt)')
    .eq('id', postId)
    .maybeSingle();

  // Dual-query fallback
  if (error || !post) {
    const { data: rawPost } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (rawPost) {
      const { data: prof } = await supabase.from('profiles').select('photo_url, rating').eq('id', rawPost.user_id).maybeSingle();
      post = { ...rawPost, profiles: prof || null };
    }
  }

  if (!post) {
    postDetailsContainer.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <i class="fa-solid fa-magnifying-glass" style="font-size:2rem;color:var(--text-muted);margin-bottom:10px;"></i>
        <h3>Skill Post Not Found</h3>
        <p><a href="main.html">Return to Discover Feed</a></p>
      </div>`;
    return;
  }

  currentPostData = post;
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && user.id === post.user_id;

  const avatarUrl = post.profiles?.photo_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
  const rating    = post.profiles?.rating || '5.0';

  postDetailsContainer.innerHTML = `
    <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
      <img src="${escapeHtml(avatarUrl)}" alt="Avatar" style="width:70px;height:70px;border-radius:var(--radius-md);object-fit:cover;border:2px solid var(--primary-light);">
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">${escapeHtml(post.skill)}</h2>
            <div style="font-size:0.9rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">Shared by ${escapeHtml(post.email)}</div>
          </div>
          
          <button class="btn-secondary" onclick="copyPostLink()" style="font-size:0.85rem;padding:6px 14px;">
            <i class="fa-solid fa-share-nodes"></i> Share Link
          </button>
        </div>

        <div class="post-badges" style="margin-top:12px;">
          <span class="badge-pill badge-amber"><i class="fa-solid fa-star"></i> ${rating} Rating</span>
          <span class="badge-pill badge-mint"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(post.location || 'Remote')}</span>
          ${post.experience ? `<span class="badge-pill badge-blue"><i class="fa-solid fa-bolt"></i> ${escapeHtml(post.experience)}</span>` : ''}
          <span class="badge-pill badge-purple"><i class="fa-solid fa-layer-group"></i> ${escapeHtml(post.category || 'General')}</span>
        </div>

        <div style="margin-top:20px;padding:20px;background:var(--bg-subtle);border-radius:var(--radius-md);border:1px solid var(--border-color);">
          <h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">Description</h4>
          <p style="font-size:0.96rem;color:var(--text-secondary);line-height:1.7;white-space:pre-line;">${escapeHtml(post.description)}</p>
        </div>

        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">
          ${!isOwner ? `
            <button class="primary" onclick="openExchangeModal('${post.id}', '${post.user_id}', '${escapeHtml(post.skill)}')">
              <i class="fa-solid fa-handshake"></i> Request Exchange
            </button>
            <button class="btn-secondary" onclick="openReviewModal('${post.user_id}', '${escapeHtml(post.email)}')">
              <i class="fa-solid fa-star"></i> Rate Mentor
            </button>
          ` : '<span style="font-size:0.9rem;color:var(--text-muted);font-weight:700;"><i class="fa-solid fa-user-check"></i> Your Shared Post</span>'}
        </div>
      </div>
    </div>
  `;
}

// ── Copy Post URL Link ────────────────────────────────────────
function copyPostLink() {
  navigator.clipboard.writeText(window.location.href);
  showToast('Skill post link copied to clipboard! 📋', 'success', 2000);
}

// ── Load Comments for this Post ───────────────────────────────
async function loadPostComments() {
  if (!commentsListContainer) return;

  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, profiles(photo_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    commentsListContainer.innerHTML = `<p style="color:var(--text-muted);">Failed to load comments.</p>`;
    return;
  }

  if (commentsTitleCount) {
    commentsTitleCount.innerHTML = `<i class="fa-solid fa-comments"></i> Comments (${comments ? comments.length : 0})`;
  }

  if (!comments || comments.length === 0) {
    commentsListContainer.innerHTML = `
      <div style="text-align:center;padding:30px 10px;color:var(--text-muted);">
        <p style="font-size:0.9rem;">No comments yet. Be the first to start the conversation!</p>
      </div>`;
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  commentsListContainer.innerHTML = '';
  comments.forEach(c => {
    const isCommentOwner = user && user.id === c.user_id;
    const avatar = c.profiles?.photo_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    const card = document.createElement('div');
    card.style.cssText = `
      display: flex;
      gap: 14px;
      padding: 14px;
      border-bottom: 1px solid var(--border-color);
      align-items: flex-start;
    `;

    card.innerHTML = `
      <img src="${escapeHtml(avatar)}" style="width:36px;height:36px;border-radius:var(--radius-md);object-fit:cover;flex-shrink:0;">
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">${escapeHtml(c.email)}</div>
          ${isCommentOwner ? `<button onclick="deleteComment('${c.id}')" style="background:none;border:none;color:var(--accent-rose-dark);font-size:0.8rem;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:4px;">${escapeHtml(c.comment)}</p>
      </div>
    `;

    commentsListContainer.appendChild(card);
  });
}

// ── Submit Comment with Spinner & Multi-Click Lock ────────────
if (submitCommentBtn) {
  submitCommentBtn.onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast('Please log in to post a comment.', 'error');

    const commentText = commentInput ? commentInput.value.trim() : '';
    if (!commentText) return showToast('Type a comment before posting.', 'error');

    submitCommentBtn.disabled = true;
    submitCommentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';
    if (commentInput) commentInput.disabled = true;

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        email: user.email,
        comment: commentText
      });

      if (error) {
        showToast('Failed to post comment: ' + error.message, 'error');
      } else {
        showToast('Comment posted! ✨', 'success', 2000);
        if (commentInput) commentInput.value = '';
        loadPostComments();
      }
    } finally {
      submitCommentBtn.disabled = false;
      submitCommentBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Comment';
      if (commentInput) commentInput.disabled = false;
    }
  };
}

// ── Delete Comment ────────────────────────────────────────────
async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) {
    showToast('Failed to delete comment: ' + error.message, 'error');
  } else {
    showToast('Comment deleted.', 'info', 1500);
    loadPostComments();
  }
}

// ── Realtime Comments Subscription ────────────────────────────
function subscribeToCommentsRealtime() {
  supabase.channel(`comments:${postId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => loadPostComments())
    .subscribe();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
