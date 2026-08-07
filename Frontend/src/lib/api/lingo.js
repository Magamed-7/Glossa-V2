import { api } from "./client.js";

export function getLingoServices({ category, cefrGroup, priceGroup, providerId } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (cefrGroup) params.set("cefr_group", cefrGroup);
  if (priceGroup) params.set("price_group", priceGroup);
  if (providerId !== undefined) params.set("provider_id", providerId);
  return api.get(`/lingo/services?${params}`);
}

export function getLingoService(id) {
  return api.get(`/lingo/services/${id}`);
}

export function createLingoProposal(serviceId, price) {
  return api.post("/lingo/proposals", { service_id: serviceId, price });
}
