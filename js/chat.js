// ==========================
//  SkillConnect Chat Module
// ==========================

// --- Load Messages Function ---
async function loadMessages() {
  const dmBox = $("dm-messages");
  const user = auth.currentUser;

  if (!user) {
    dmBox.innerHTML = "<p>Please log in to view messages.</p>";
    return;
  }

  // Listen for new messages in real time
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
          word-wrap:break-word;
        `;
        div.textContent = `${m.from === user.email ? "You" : m.from}: ${m.msg}`;
        dmBox.appendChild(div);
      }
    });

    dmBox.scrollTop = dmBox.scrollHeight;
  });
}

// --- Send Message Button Logic ---
$("send-dm-btn").onclick = async () => {
  const to = $("dm-to").value.trim();
  const msg = $("dm-msg").value.trim();
  const user = auth.currentUser;

  if (!user) return showToast("Login first!", "error");
  if (!to || !msg) return showToast("Enter recipient and message!", "error");

  try {
    await db.ref("dms").push({
      from: user.email,
      to,
      msg,
      timestamp: Date.now(),
    });

    $("dm-msg").value = "";
    showToast("Message sent!");
  } catch (err) {
    console.error("❌ Error sending message:", err);
    showToast("Failed to send message!", "error");
  }
};

// --- Auto Load Messages After Login ---
auth.onAuthStateChanged((user) => {
  if (user) {
    loadMessages();
  } else {
    const dmBox = $("dm-messages");
    if (dmBox) dmBox.innerHTML = "<p>Please log in to view messages.</p>";
  }
});

// --- Load messages when Messages section is opened ---
document.addEventListener("DOMContentLoaded", () => {
  const msgNav = $("nav-messages");
  if (msgNav) {
    msgNav.addEventListener("click", () => {
      if ($("dm-section")) {
        $("dm-section").style.display = "block";
        loadMessages();
      }
    });
  }
});

window.loadMessages = loadMessages;
