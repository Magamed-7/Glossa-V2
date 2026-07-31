import { api } from "./client.js";

export function getSettings() {
  return api.get("/settings/me");
}

export function updateSettings(patch) {
  return api.patch("/settings/me", patch);
}
