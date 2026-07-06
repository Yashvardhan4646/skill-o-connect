// --- SECURE AUTHENTICATION SYSTEM WITH ROLE SELECTION (Supabase) ---
console.log('✅ Secure Auth script loaded with Mentor/Mentee Role Selection');

const loginPopup  = document.getElementById('loginPopup');
const logoutBtn   = document.getElementById('logout-btn');
const signupBtn   = document.getElementById('signup-btn');
const loginBtn    = document.getElementById('login-btn');

// Email Regex Validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Password Strength Check (Minimum 6 characters)
function isValidPassword(password) {
  return password && password.length >= 6;
}

// ── Sign Up with Mentor vs Mentee Role Selection ──────────────────
if (signupBtn) {
  signupBtn.onclick = async () => {
    const email      = document.getElementById('email').value.trim();
    const password   = document.getElementById('password').value.trim();
    const roleSelect = document.getElementById('signup-user-role');
    const userRole   = roleSelect ? roleSelect.value : 'both';

    if (!email || !password) {
      return showToast('Please enter both email and password.', 'error');
    }

    if (!isValidEmail(email)) {
      return showToast('Please enter a valid email address.', 'error');
    }

    if (!isValidPassword(password)) {
      return showToast('Password must be at least 6 characters long.', 'error');
    }

    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { user_role: userRole }
      }
    });

    signupBtn.disabled = false;
    signupBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Sign Up';

    if (error) {
      return showToast(error.message, 'error');
    }

    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        user_role: userRole
      });
    }

    showToast(`Account created as ${userRole === 'mentor' ? 'Mentor 🎓' : userRole === 'mentee' ? 'Mentee 🚀' : 'Mentor & Mentee 🔄'}! Check email to confirm if required.`, 'success', 5000);
  };
}

// ── Log In ───────────────────────────────────────────────────
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      return showToast('Please enter both email and password.', 'error');
    }

    if (!isValidEmail(email)) {
      return showToast('Please enter a valid email address.', 'error');
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging In...';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Log In';

    if (error) {
      return showToast(error.message, 'error');
    }

    showToast('Logged in successfully!', 'success');
  };
}

// ── Log Out ──────────────────────────────────────────────────
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return showToast(error.message, 'error');
    showToast('Logged out safely.', 'info');
  };
}

// ── Password Reset Request ────────────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById('email').value.trim();
  if (!email || !isValidEmail(email)) {
    return showToast('Enter your valid email address above to receive password reset instructions.', 'info');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    showToast(error.message, 'error');
  } else {
    showToast('Password reset email sent! Check your inbox.', 'success');
  }
}

// ── Auth State Listener (Silent Session Restores) ──────────────
supabase.auth.onAuthStateChange((event, session) => {
  const user           = session?.user ?? null;
  const userPillWrap   = document.getElementById('user-pill-wrap');
  const userEmailTop   = document.getElementById('user-email-top');
  const userPillLetter = document.getElementById('user-pill-letter');
  const guestGreeting  = document.getElementById('guest-greeting');

  if (user) {
    if (loginPopup)     loginPopup.classList.remove('active');
    if (logoutBtn)      logoutBtn.style.display = 'inline-flex';
    if (userPillWrap)   userPillWrap.style.display = 'flex';
    if (userEmailTop)   userEmailTop.textContent = user.email;
    if (userPillLetter) userPillLetter.textContent = user.email.charAt(0).toUpperCase();
    if (guestGreeting)  guestGreeting.style.display = 'none';
  } else {
    if (logoutBtn)      logoutBtn.style.display = 'none';
    if (userPillWrap)   userPillWrap.style.display = 'none';
    if (guestGreeting)  guestGreeting.style.display = 'block';
    if (loginPopup)     loginPopup.classList.add('active');
  }
});
