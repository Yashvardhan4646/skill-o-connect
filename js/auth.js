// --- AUTH LOGIC ---
console.log("✅ Auth script loaded");

$('signup-btn').onclick = () => {
  const email = $('email').value.trim();
  const password = $('password').value.trim();
  if (!email || !password) return alert('Enter email and password');
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => console.log('User signed up'))
    .catch(e => alert(e.message));
};

$('login-btn').onclick = () => {
  const email = $('email').value.trim();
  const password = $('password').value.trim();
  if (!email || !password) return alert('Enter email and password');
  auth.signInWithEmailAndPassword(email, password)
    .then(() => console.log('User logged in'))
    .catch(e => alert(e.message));
};

$('logout-btn').onclick = () => {
  auth.signOut().then(() => console.log('User logged out'));
};

// --- On Auth Change ---
auth.onAuthStateChanged(user => {
  if (user) {
    $('loginPopup').style.display = 'none';
    $('logout-btn').style.display = 'block';
    $('user-email-top').textContent = user.email;
  } else {
    $('loginPopup').style.display = 'flex';
    $('logout-btn').style.display = 'none';
    $('user-email-top').textContent = '';
  }
});
