import { api } from "./client.js";

export function getStreak() {
  return api.get("/streak/my");
}
