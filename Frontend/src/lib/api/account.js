import { api } from "./client.js";
import { getAccessToken } from "../auth/tokens.js";

export function getTelegramLink() {
  return api.post("/telegram/link");
}

export function unlinkTelegram() {
  return api.post("/telegram/unlink");
}

export function exportMyData() {
  return api.get("/export/me");
}

export async function exportMyDataPdf() {
  const token = getAccessToken();
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const res = await fetch(`${base}/export/me/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "PDF export failed");
  }
  return res.blob();
}
