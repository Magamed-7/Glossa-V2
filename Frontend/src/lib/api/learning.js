import { api } from "./client.js";

export function getStats() {
  return api.get("/learning/stats");
}

export function getDailyMissions() {
  return api.get("/learning/daily-missions");
}

