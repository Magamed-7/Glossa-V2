import { api } from "./client.js";

export function getPlans() {
  return api.get("/subscriptions/plans");
}

export function getMySubscription() {
  return api.get("/subscriptions/my");
}

export function subscribe({ plan_code, period }) {
  return api.post("/subscriptions/subscribe", { plan_code, period });
}
