import { api } from "./client.js";

export function getMyProfile() {
  return api.get("/profile/me");
}

export function updateMyProfile({ bio, interests }) {
  return api.patch("/profile/me", { bio, interests });
}

export function uploadPhoto(file) {
  const body = new FormData();
  body.append("file", file);
  return api.post("/profile/me/photo", body);
}

export function getPrivacy() {
  return api.get("/profile/me/privacy");
}

export function updatePrivacy(patch) {
  return api.patch("/profile/me/privacy", patch);
}

export function addLanguage({ language, level, is_target }) {
  return api.post("/profile/languages", { language, level, is_target });
}

export function getPublicProfile(userId) {
  return api.get(`/profile/${userId}`);
}
