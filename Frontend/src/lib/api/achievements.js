import { api } from "./client.js";

export function getAllAchievements() {
  return api.get("/achievements");
}

export function getMyAchievements() {
  return api.get("/achievements/my");
}
