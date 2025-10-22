// ==========================
//  SkillConnect Chat Module
// ==========================
const { auth, db, $ } = window.firebaseApp;

async function loadMessages() {
  const dmBox = $("dm-messages");
  const user = auth.currentUser;
  if (!user) {
    dmBox.innerHTML = "<p>Please log in to view messages.</p>";
    return;
  }

  db.ref("dms").on("value", (snap) => {
    dmBox.innerHTML = "";
    const msgs = [];
    snap.forEach((m) => msgs.push(m.val()));
    msgs.sort((a, b) => a.timestamp - b.timestamp);

    msgs.forEach((m) => {
      if (m.from === user.email || m.to === user.email) {
        const div = document.createElement("div");
        div.style = `
          background:${m.from === user.email ? "#eaf4f2" : "#f3f4f6"};
          padding:8px 12px;margin:4px;border-radius:8px;
          font-size:0.9rem;
        `;
        div.textContent = `${m.from === user.email ? "You" : m.from}: ${m.msg}`;
        dmBox.appendChild(div);
      }
    });

    dmBox.scrollTop = dmBox.scrollHeight;
  });
}

// --- Send Message ---
$("send-dm-btn").onclick = async () => {
  const to = $("dm-to").value.trim();
  const msg = $("dm-msg").value.trim();
  const user = auth.currentUser;

  if (!user) return showToast("Login first!", "error");
  if (!to || !msg) return showToast("Enter recipient and message!", "error");

  await db.ref("dms").push({
    from: user.email,
    to,
    msg,
    timestamp: Date.now(),
  });

  $("dm-msg").value = "";
  showToast("Message sent!");
};

window.loadMessages = loadMessages;
