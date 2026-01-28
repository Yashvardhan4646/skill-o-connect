const db = firebase.database();
const auth = firebase.auth();

const dmToInput = document.getElementById("dm-to");
const dmMsgInput = document.getElementById("dm-msg");
const dmMessages = document.getElementById("dm-messages");
const sendBtn = document.getElementById("send-dm-btn");

let currentChatRef = null;

// Helper: create unique chat ID (same for both users)
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("__");
}

// Load messages for selected user
async function loadChat(targetEmail) {
  const usersSnap = await db.ref("users").once("value");
  let targetUid = null;

  usersSnap.forEach(u => {
    if (u.val().email === targetEmail) {
      targetUid = u.key;
    }
  });

  if (!targetUid) {
    alert("User not found");
    return;
  }

  const myUid = auth.currentUser.uid;
  const chatId = getChatId(myUid, targetUid);

  if (currentChatRef) currentChatRef.off();

  dmMessages.innerHTML = "";
  currentChatRef = db.ref("messages/" + chatId);

  currentChatRef.on("child_added", snap => {
    const msg = snap.val();
    const div = document.createElement("div");

    div.style.margin = "6px 0";
    div.style.padding = "8px 10px";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "80%";
    div.style.fontSize = "0.9rem";

    if (msg.from === myUid) {
      div.style.marginLeft = "auto";
      div.style.background = "#111";
      div.style.color = "#fff";
    } else {
      div.style.background = "#f1f1f1";
      div.style.color = "#000";
    }

    div.textContent = msg.text;
    dmMessages.appendChild(div);
    dmMessages.scrollTop = dmMessages.scrollHeight;
  });
}

// Send message
sendBtn.onclick = async () => {
  const text = dmMsgInput.value.trim();
  const targetEmail = dmToInput.value.trim();
  if (!text || !targetEmail) return;

  const usersSnap = await db.ref("users").once("value");
  let targetUid = null;

  usersSnap.forEach(u => {
    if (u.val().email === targetEmail) {
      targetUid = u.key;
    }
  });

  if (!targetUid) {
    alert("User not found");
    return;
  }

  const myUid = auth.currentUser.uid;
  const chatId = getChatId(myUid, targetUid);

  db.ref("messages/" + chatId).push({
    from: myUid,
    to: targetUid,
    text,
    timestamp: Date.now()
  });

  dmMsgInput.value = "";
};

// Load chat when email changes
dmToInput.addEventListener("change", () => {
  loadChat(dmToInput.value.trim());
});
