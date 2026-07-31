import { api } from "./client.js";

export function getTelegramLink() {
  return api.post("/telegram/link");
}

export function exportMyData() {
  return api.get("/export/me");
}
