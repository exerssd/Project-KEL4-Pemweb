const AUTH_API = "../backend/api/auth.php";
let authMode = "login";
let currentUser = null;

async function authRequest(action, body = null) {
  const options = { credentials: "same-origin" };

  if (body) {
    options.method = "POST";
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify({ action, ...body });
  } else {
    options.method = "GET";
  }

  const response = await fetch(AUTH_API + (body ? "" : "?action=" + action), options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

function setAuthMessage(message = "") {
  $("#auth-message").textContent = message;
}

function openAuthModal() {
  setAuthMessage();
  setAuthMode("login");
  $("#auth-form").reset();
  $("#auth-modal").classList.add("on");
  $("#auth-email").focus();
}

function closeAuthModal() {
  $("#auth-modal").classList.remove("on");
  $("#auth-form").reset();
  setAuthMode("login");
  setAuthMessage();
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.authTab === mode);
  });

  const isRegister = mode === "register";
  $("#auth-name-field").hidden = !isRegister;
  $("#auth-name").required = isRegister;
  $("#auth-password").autocomplete = isRegister ? "new-password" : "current-password";
  $("#auth-title").textContent = isRegister ? "Daftar Akun" : "Masuk Akun";
  $("#auth-submit").textContent = isRegister ? "Daftar" : "Masuk";
  setAuthMessage();
}

function updateAuthButton() {
  const button = $("#auth-open");
  if (!currentUser) {
    button.textContent = "Masuk / Daftar";
    button.onclick = openAuthModal;
    return;
  }

  button.textContent = currentUser.name;
  button.onclick = async () => {
    if (!confirm(`Keluar sebagai ${currentUser.name}?`)) return;
    try {
      await authRequest("logout");
      currentUser = null;
      updateAuthButton();
    } catch (error) {
      alert(error.message);
    }
  };
}

async function loadCurrentUser() {
  try {
    const data = await authRequest("profile");
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  updateAuthButton();
}

function initAuth() {
  $("#auth-close").addEventListener("click", closeAuthModal);

  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
  });

  $("#auth-modal").addEventListener("click", (event) => {
    if (event.target.id === "auth-modal") closeAuthModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#auth-modal").classList.contains("on")) {
      closeAuthModal();
    }
  });

  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = $("#auth-submit");
    submit.disabled = true;

    const payload = {
      email: $("#auth-email").value,
      password: $("#auth-password").value,
    };
    if (authMode === "register") payload.name = $("#auth-name").value;

    try {
      const data = await authRequest(authMode, payload);
      currentUser = data.user;
      closeAuthModal();
      updateAuthButton();
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      submit.disabled = false;
    }
  });

  updateAuthButton();
  loadCurrentUser();
  setAuthMode("login");
}
