import { api } from "./client.js";

export function startContextHelp(contextType, contextRefId, language = "English", forceNew = false) {
  return api.post("/ai/context-help/start", {
    context_type: contextType,
    context_ref_id: contextRefId,
    language,
    force_new: forceNew,
  });
}

export function sendContextHelpMessage(sessionId, text) {
  return api.post(`/ai/context-help/${sessionId}/message`, { text });
}
