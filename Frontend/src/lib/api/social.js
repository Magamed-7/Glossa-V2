import { api } from "./client.js";

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
