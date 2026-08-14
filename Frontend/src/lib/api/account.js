import { api } from "./client.js";

export function getTelegramLink() {
  return api.post("/telegram/link");
}

export function unlinkTelegram() {
  return api.post("/telegram/unlink");
}

export function exportMyData() {
  return api.get("/export/me");
}
