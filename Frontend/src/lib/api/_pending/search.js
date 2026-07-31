// GET /search/stories и /search/vocabulary настоящие, но требуют Elasticsearch, который
// поднимается только в docker compose --profile full. Без него запрос падает, и здесь —
// молчаливый откат на клиентскую фильтрацию по уже загруженным данным.
// См. Frontend/Plan/MISSING_API.md, пункт 7.
import { api } from "../client.js";
import { getStories } from "../stories.js";
import { getVocabulary } from "../vocabulary.js";

export async function searchStories(q) {
  try {
    const items = await api.get(`/search/stories?q=${encodeURIComponent(q)}`);
    return { source: "elasticsearch", items };
  } catch (e) {
    const all = await getStories({ limit: 100 });
    const needle = q.toLowerCase();
    return { source: "local", items: all.filter((s) => s.title.toLowerCase().includes(needle)) };
  }
}

export async function searchVocabulary(q) {
  try {
    const items = await api.get(`/search/vocabulary?q=${encodeURIComponent(q)}`);
    return { source: "elasticsearch", items };
  } catch (e) {
    const items = await getVocabulary({ search: q, limit: 100 });
    return { source: "local", items };
  }
}
