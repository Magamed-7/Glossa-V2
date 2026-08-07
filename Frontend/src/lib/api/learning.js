import { api } from "./client.js";

export function getStats() {
  return api.get("/learning/stats");
}

export function getDailyMissions() {
  return api.get("/learning/daily-missions");
}

export function getOnboardingStatus() {
  return api.get("/learning/onboarding/status");
}

export function submitOnboarding(data) {
  return api.post("/learning/onboarding", data);
}

export function getTodayQueue() {
  return api.get("/learning/today");
}

export function getCourseUnits(level) {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  const query = params.toString();
  return api.get(`/learning/units${query ? `?${query}` : ""}`);
}

export function getCourseUnitDetail(unitId) {
  return api.get(`/learning/units/${unitId}`);
}

export function completeAtom(unitId, atomType, timeSpentSeconds = 0) {
  return api.post(`/learning/units/${unitId}/atoms/${atomType}/complete`, {
    time_spent_seconds: timeSpentSeconds,
  });
}

export function getCourseProgress() {
  return api.get("/learning/progress");
}

export function getTestAvailability(level, testType) {
  return api.get(`/learning/tests/${level}/${testType}`);
}

export function generateTest(level, testType) {
  return api.post(`/learning/tests/${level}/${testType}/generate`);
}
