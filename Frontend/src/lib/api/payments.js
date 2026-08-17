import { api } from "./client.js";

export function getBalance() {
  return api.get("/balance");
}

export function getPaymentLink() {
  return api.post("/telegram/payment-link");
}

export function getHistory() {
  return api.get("/payments/history");
}

export function getAnalytics() {
  return api.get("/payments/analytics");
}
