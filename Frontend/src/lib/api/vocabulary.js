import { api } from "./client.js";

export function getVocabulary({ level, unit, search, locale, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (level) params.set("level", level);
  if (unit) params.set("unit", unit);
  if (search) params.set("search", search);
  if (locale) params.set("locale", locale);
  return api.get(`/vocabulary/?${params}`);
}

export function getVocabularyEntry(entryId, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/vocabulary/${entryId}${query ? `?${query}` : ""}`);
}
