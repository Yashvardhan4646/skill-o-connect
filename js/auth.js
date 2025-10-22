// ==========================
//  SkillConnect Auth Module
// ==========================

const { auth, db, $, storage } = window.firebaseApp;

// --- Sign Up ---
$("signup-btn").onclick = async () => {
  const email = $("email").value.trim();
  const password = $("password").value.trim();
  if (!email || !password) return alert("Please fill in both fields.");

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    // create user node
    await db.ref("users/" + cred.user.uid).set({
      email,
      joined: Date.now(),
      verified: false,
    });
    $("loginPopup").style.display = "none";
  } catch (err) {
    alert(err.message);
  }
};

// --- Log In ---
$("login-btn").onclick = async () => {
  const email = $("email").value.trim();
  const password = $("password").value.trim();
  if (!email || !password) return alert("Please fill in both fields.");

  try {
    await auth.signInWithEmailAndPassword(email, password);
    $("loginPopup").style.display = "none";
  } catch (err) {
    alert(err.message);
  }
};

// --- Log Out ---
$("logout-btn").onclick = async () => {
  await auth.signOut();
  alert("Logged out successfully.");
};

// --- Prevent closing login modal when unauthenticated ---
auth.onAuthStateChanged((user) => {
  const popup = $("loginPopup");
  popup.style.display = user ? "none" : "flex";
});
