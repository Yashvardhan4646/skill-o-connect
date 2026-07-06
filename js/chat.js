console.log('✅ Split Chat Inbox loaded — Supabase Realtime');

const inboxListContainer  = document.getElementById('inbox-list');
const dmMsgInput          = document.getElementById('dm-msg');
const dmMessages          = document.getElementById('dm-messages');
const sendBtn             = document.getElementById('send-dm-btn');
const chatWindowHeader    = document.getElementById('chat-window-header');

let activeChatId          = null;
let activeReceiverUser    = null; // { id, email, photo_url }
let chatRealtimeChannel   = null;

function buildChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('__');
}

// ── Open Direct Chat with any user from Post Cards or Map ─────
async function openDirectChatWithUser(recipientUserId, recipientEmail) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    document.getElementById('loginPopup')?.classList.add('active');
    return showToast('Please log in to send direct messages.', 'error');
  }

  if (user.id === recipientUserId) {
    return showToast('You cannot send a message to yourself.', 'info');
  }

  // Switch tab to Messages section
  const navMessagesBtn = document.getElementById('nav-messages');
  if (navMessagesBtn) navMessagesBtn.click();

  const chatId = buildChatId(user.id, recipientUserId);
  
  // Fetch partner profile photo if available
  const { data: partnerProf } = await supabase
    .from('profiles')
    .select('id, email, photo_url')
    .eq('id', recipientUserId)
    .maybeSingle();

  const partner = partnerProf || { id: recipientUserId, email: recipientEmail || 'User' };

  await selectConversation(chatId, partner);

  if (dmMsgInput) {
    setTimeout(() => dmMsgInput.focus(), 300);
  }
}

// ── Render Inbox Conversations List ───────────────────────────
async function loadInboxConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !inboxListContainer) return;

  // Fetch distinct messages involving current user
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender_id, receiver_id')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) console.warn("Inbox load notice:", error.message);

  // Map unique conversations by chat_id
  const conversationsMap = new Map();
  (messages || []).forEach(msg => {
    if (!conversationsMap.has(msg.chat_id)) {
      conversationsMap.set(msg.chat_id, msg);
    }
  });

  // Fallback: If no past conversations, show community members to start chatting
  if (conversationsMap.size === 0) {
    const { data: communityUsers } = await supabase
      .from('profiles')
      .select('id, email, photo_url')
      .neq('id', user.id)
      .limit(6);

    if (!communityUsers || communityUsers.length === 0) {
      inboxListContainer.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
          No conversations yet. Browse posts to message mentors!
        </div>`;
      return;
    }

    inboxListContainer.innerHTML = `
      <div style="padding:10px 14px;font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">
        Start a Conversation
      </div>`;

    communityUsers.forEach(u => {
      const chatId = buildChatId(user.id, u.id);
      const item = document.createElement('div');
      item.className = `inbox-item ${chatId === activeChatId ? 'active' : ''}`;
      item.onclick = () => selectConversation(chatId, u);

      item.innerHTML = `
        <div class="inbox-avatar">
          ${u.photo_url ? `<img src="${u.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);">` : u.email.charAt(0).toUpperCase()}
        </div>
        <div class="inbox-item-info">
          <div class="inbox-item-email">${escapeHtml(u.email)}</div>
          <div class="inbox-item-snippet" style="color:var(--primary);">Click to start chat</div>
        </div>
      `;
      inboxListContainer.appendChild(item);
    });
    return;
  }

  // Fetch partner profiles for all conversation partners
  const partnerIds = new Set();
  conversationsMap.forEach(msg => {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    partnerIds.add(partnerId);
  });

  const { data: partnerProfiles } = await supabase
    .from('profiles')
    .select('id, email, photo_url')
    .in('id', Array.from(partnerIds));

  const profilesMap = new Map();
  (partnerProfiles || []).forEach(p => profilesMap.set(p.id, p));

  inboxListContainer.innerHTML = '';
  conversationsMap.forEach((lastMsg, chatId) => {
    const partnerId = lastMsg.sender_id === user.id ? lastMsg.receiver_id : lastMsg.sender_id;
    const partner = profilesMap.get(partnerId) || { id: partnerId, email: 'User', photo_url: null };

    const item = document.createElement('div');
    item.className = `inbox-item ${chatId === activeChatId ? 'active' : ''}`;
    item.onclick = () => selectConversation(chatId, partner);

    item.innerHTML = `
      <div class="inbox-avatar">
        ${partner.photo_url ? `<img src="${partner.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);">` : partner.email.charAt(0).toUpperCase()}
      </div>
      <div class="inbox-item-info">
        <div class="inbox-item-email">${escapeHtml(partner.email)}</div>
        <div class="inbox-item-snippet">${escapeHtml(lastMsg.content)}</div>
      </div>
    `;

    inboxListContainer.appendChild(item);
  });
}

// ── Select and Load Conversation ──────────────────────────────
async function selectConversation(chatId, partner) {
  activeChatId = chatId;
  activeReceiverUser = partner;

  if (chatWindowHeader) {
    chatWindowHeader.innerHTML = `<i class="fa-solid fa-user-circle"></i> Chat with <strong>${escapeHtml(partner.email)}</strong>`;
  }

  if (dmMsgInput) dmMsgInput.disabled = false;
  if (sendBtn) sendBtn.disabled = false;

  dmMessages.innerHTML = '';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: history, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) return showToast('Failed to load chat: ' + error.message, 'error');

  if (!history || history.length === 0) {
    dmMessages.innerHTML = `
      <div style="text-align:center;padding-top:100px;color:var(--text-muted);">
        <i class="fa-regular fa-paper-plane" style="font-size:2rem;margin-bottom:8px;display:block;"></i>
        Say hello to start the conversation!
      </div>`;
  } else {
    history.forEach(msg => dmMessages.appendChild(renderBubble(msg, user.id)));
    dmMessages.scrollTop = dmMessages.scrollHeight;
  }

  // Subscribe to Realtime push
  if (chatRealtimeChannel) supabase.removeChannel(chatRealtimeChannel);

  chatRealtimeChannel = supabase
    .channel(`chat:${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`
    }, payload => {
      dmMessages.appendChild(renderBubble(payload.new, user.id));
      dmMessages.scrollTop = dmMessages.scrollHeight;
      loadInboxConversations();
    })
    .subscribe();
}

function renderBubble(msg, myId) {
  const div = document.createElement('div');
  const isMine = msg.sender_id === myId;

  div.style.cssText = `
    margin: 6px 0;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    max-width: 75%;
    font-size: 0.9rem;
    font-weight: 500;
    word-break: break-word;
    box-shadow: var(--shadow-sm);
    ${isMine
      ? 'margin-left:auto; background:var(--primary); color:#fff; border-bottom-right-radius:2px;'
      : 'margin-right:auto; background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-color); border-bottom-left-radius:2px;'}
  `;
  div.textContent = msg.content;
  return div;
}

// ── Send Message ──────────────────────────────────────────────
async function sendMessage() {
  const text = dmMsgInput?.value.trim();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return showToast('Please log in first.', 'error');
  if (!activeReceiverUser || !activeChatId) return showToast('Select a user to message.', 'error');
  if (!text) return showToast('Type a message first.', 'error');

  sendBtn.disabled = true;

  try {
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeReceiverUser.id || activeReceiverUser.user_id,
      chat_id: activeChatId,
      content: text
    });

    if (error) {
      showToast('Failed to send message: ' + error.message, 'error');
    } else {
      dmMsgInput.value = '';
    }
  } finally {
    sendBtn.disabled = false;
  }
}

if (sendBtn) sendBtn.onclick = sendMessage;

if (dmMsgInput) {
  dmMsgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Boot Inbox ────────────────────────────────────────────────
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    loadInboxConversations();
  } else {
    if (inboxListContainer) inboxListContainer.innerHTML = '';
    if (dmMessages) dmMessages.innerHTML = '';
  }
});
