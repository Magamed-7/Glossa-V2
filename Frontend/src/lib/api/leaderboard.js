import { api } from "./client.js";

export function getGlobal() {
  return api.get("/leaderboard/global");
}

export function getWeekly() {
  return api.get("/leaderboard/weekly");
}

export function getMyRank() {
  return api.get("/leaderboard/me");
}
