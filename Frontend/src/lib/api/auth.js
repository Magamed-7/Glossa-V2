import { auth } from "./client.js";

const BASE = "/api/auth";

export function register({ username, email, password }) {
  return auth.post(`${BASE}/register`, { username, email, password }, { auth: false });
}

export function login({ username, password }) {
  return auth.post(`${BASE}/login`, { username, password }, { auth: false });
}

export function verify2faLogin({ pending_token, code }) {
  return auth.post(`${BASE}/login/2fa`, { pending_token, code }, { auth: false });
}

export function getMe() {
  return auth.get(`${BASE}/me`);
}

export function updateMe({ username }) {
  return auth.patch(`${BASE}/me`, { username });
}

export function requestEmailChange({ new_email }) {
  return auth.post(`${BASE}/me/email/change/request`, { new_email });
}

export function confirmEmailChange({ code }) {
  return auth.post(`${BASE}/me/email/change/confirm`, { code });
}

export function deleteMe({ password }) {
  return auth.delete(`${BASE}/me`, { password });
}

export function changePassword({ old_password, new_password }) {
  return auth.post(`${BASE}/change-password`, { old_password, new_password });
}

export function verifyEmail({ code, email }) {
  return auth.post(`${BASE}/verify-email`, email ? { code, email } : { code });
}

export function resendVerification() {
  return auth.post(`${BASE}/verify-email/resend`);
}

export function requestEnable2fa({ password }) {
  return auth.post(`${BASE}/2fa/enable/request`, { password });
}

export function confirmEnable2fa({ code }) {
  return auth.post(`${BASE}/2fa/enable/confirm`, { code });
}

export function requestDisable2fa({ password }) {
  return auth.post(`${BASE}/2fa/disable/request`, { password });
}

export function confirmDisable2fa({ code }) {
  return auth.post(`${BASE}/2fa/disable/confirm`, { code });
}

export function requestPasswordReset({ email }) {
  return auth.post(`${BASE}/password-reset`, { email }, { auth: false });
}

export function verifyPasswordReset({ email, code }) {
  return auth.post(`${BASE}/password-reset/verify`, { email, code }, { auth: false });
}

export function confirmPasswordReset({ email, code, password, password_confirm }) {
  return auth.post(`${BASE}/password-reset/confirm`, { email, code, password, password_confirm }, { auth: false });
}


