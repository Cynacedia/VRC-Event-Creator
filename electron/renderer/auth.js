// Authentication and session management for VRChat Event Creator

import { dom, state } from "./state.js";
import { setStatus, showToast, setAuthState } from "./ui.js";
import { t } from "./i18n/index.js";
import { sanitizePassword, sanitizeUsername } from "./utils.js";

// ============================================================================
// Session Management
// ============================================================================

export async function checkSession(api, refreshDataFn) {
  setStatus(t("auth.sessionChecking"));
  try {
    const user = await api.getCurrentUser();
    if (user) {
      await onLoginSuccess(api, user, refreshDataFn);
      return;
    }
  } catch (err) {
    showToast("Session check failed.", true);
  }
  setAuthState(false);
  setStatus(t("auth.loginRequired"));
}

async function onLoginSuccess(api, user, refreshDataFn) {
  state.user = user;
  setAuthState(true);
  dom.aboutSession.textContent = user.displayName || "Authenticated";
  setStatus(t("auth.loggedInAs", { name: user.displayName || "user" }));
  await refreshDataFn();
}

// ============================================================================
// Login/Logout Handlers
// ============================================================================

export async function handleLogin(event, api, refreshDataFn) {
  event.preventDefault();
  const username = sanitizeUsername(dom.loginUsername.value);
  const password = sanitizePassword(dom.loginPassword.value);
  dom.loginUsername.value = username;
  dom.loginPassword.value = password;
  if (!username || !password) {
    showToast("Enter username and password.", true);
    return;
  }
  setStatus(t("auth.loggingIn"));
  try {
    const result = await api.login({ username, password });
    if (result && result.user) {
      dom.loginPassword.value = "";
      await onLoginSuccess(api, result.user, refreshDataFn);
    }
  } catch (err) {
    showToast(err?.message || "Login failed.", true);
    setStatus(t("auth.loginFailed"));
  }
}

export function handleLoginClose(api) {
  api.quitApp();
}

export async function handleLogout(api) {
  try {
    await api.logout();
  } catch (err) {
    showToast("Logout failed.", true);
  }
  state.user = null;
  setAuthState(false);
  setStatus(t("auth.loggedOut"));
}

// ============================================================================
// Settings Handlers
// ============================================================================

export function handleSettingsSave() {
  showToast(t("settings.saved"));
}
