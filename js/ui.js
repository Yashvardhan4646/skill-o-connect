// ==========================
//  SkillConnect UI Module
// ==========================

// --- Simple toast ---
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: type === "error" ? "#ff5555" : "#2a7c6f",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
    opacity: "0",
    transition: "opacity 0.3s, transform 0.3s",
    transform: "translateY(20px)",
    zIndex: "9999",
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// --- Loader overlay ---
function showLoader(text = "Loading...") {
  let overlay = document.getElementById("global-loader");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "global-loader";
    overlay.innerHTML = `<div class="loader-box"><div class="spinner"></div><p>${text}</p></div>`;
    document.body.appendChild(overlay);
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(255,255,255,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "9998",
      backdropFilter: "blur(2px)"
    });
  }
}

function hideLoader() {
  const overlay = document.getElementById("global-loader");
  if (overlay) overlay.remove();
}

// --- Spinner styling ---
const style = document.createElement("style");
style.textContent = `
  .loader-box .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #2a7c6f;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {to{transform: rotate(360deg)}}
`;
document.head.appendChild(style);

// Expose globally
window.showToast = showToast;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
