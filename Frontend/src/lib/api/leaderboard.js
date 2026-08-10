import { api } from "./client.js";

export function getGlobal() {
  return api.get("/leaderboard/global");
}

export function getWeekly() {
  return api.get("/leaderboard/weekly");
}

export function getMyRank(period = "global") {
  return api.get(`/leaderboard/me?period=${period}`);
}

export function resetLeaderboard(period = "global") {
  return api.post(`/leaderboard/reset?period=${period}`);
}
