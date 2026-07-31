import { api } from "./client.js";

export function getBalance() {
  return api.get("/balance");
}

export function topup(amount) {
  return api.post("/balance/topup", { amount });
}

export function createCheckoutSession({ amount, currency = "usd" }) {
  return api.post("/stripe/create-checkout-session", { amount, currency });
}

export function getHistory() {
  return api.get("/payments/history");
}
