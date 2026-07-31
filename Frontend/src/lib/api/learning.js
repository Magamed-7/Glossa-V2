import { api } from "./client.js";

export function getStats() {
  return api.get("/learning/stats");
}
