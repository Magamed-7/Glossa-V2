import { api } from "./client.js";

export function generateVocabStory({ levels, wordStatus, approxWordCount }) {
  return api.post("/vocabulary/generate-story", {
    levels: levels || [],
    word_status: wordStatus || "all",
    approx_word_count: approxWordCount || 150,
  });
}

export function getVocabStoryHistory({ limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const query = params.toString();
  return api.get(`/vocabulary/generate-story/history${query ? `?${query}` : ""}`);
}

export function getVocabStory(storyId) {
  return api.get(`/vocabulary/generate-story/${storyId}`);
}
