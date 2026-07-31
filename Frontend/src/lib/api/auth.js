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

export function updateMe({ username, email }) {
  return auth.patch(`${BASE}/me`, { username, email });
}

export function deleteMe({ password }) {
  return auth.delete(`${BASE}/me`, { password });
}

export function changePassword({ old_password, new_password }) {
  return auth.post(`${BASE}/change-password`, { old_password, new_password });
}

export function verifyEmail({ code }) {
  return auth.post(`${BASE}/verify-email`, { code });
}

export function resendVerification() {
  return auth.post(`${BASE}/verify-email/resend`);
}

export function setup2fa() {
  return auth.post(`${BASE}/2fa/setup`);
}

export function confirm2fa({ code }) {
  return auth.post(`${BASE}/2fa/confirm`, { code });
}

export function disable2fa({ password }) {
  return auth.post(`${BASE}/2fa/disable`, { password });
}
