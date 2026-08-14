import { api } from "./client.js";

export function searchUsers({ q, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (q) params.set("q", q);
  return api.get(`/social/search?${params}`);
}

export function getFollowers() {
  return api.get("/social/followers");
}

export function getFollowing() {
  return api.get("/social/following");
}

export function getFriends() {
  return api.get("/social/friends");
}

export function follow(userId) {
  return api.post(`/social/follow/${userId}`);
}

export function unfollow(userId) {
  return api.delete(`/social/follow/${userId}`);
}
