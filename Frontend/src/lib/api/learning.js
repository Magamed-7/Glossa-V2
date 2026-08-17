import { api } from "./client.js";

export function getStats() {
  return api.get("/learning/stats");
}

export function getDailyMissions() {
  return api.get("/learning/daily-missions");
}

export function restoreStreak() {
  return api.post("/learning/streak/restore");
}

export function getOnboardingStatus() {
  return api.get("/learning/onboarding/status");
}

export function submitOnboarding(data) {
  return api.post("/learning/onboarding", data);
}

export function getTodayQueue({ locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/learning/today${query ? `?${query}` : ""}`);
}

export function getCourseUnits(level, { locale } = {}) {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/learning/units${query ? `?${query}` : ""}`);
}

export function getCourseUnitDetail(unitId, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/learning/units/${unitId}${query ? `?${query}` : ""}`);
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

export function generateLevelTest(level, testType, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.post(`/learning/tests/${level}/${testType}/generate${query ? `?${query}` : ""}`);
}

export function submitLevelTest(level, testType, attemptId, answers, timeSpentSeconds = 0) {
  return api.post(`/learning/tests/${level}/${testType}/${attemptId}/submit`, {
    answers,
    time_spent_seconds: timeSpentSeconds,
  });
}

export function generateUnitTest(unitId, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.post(`/learning/units/${unitId}/test/generate${query ? `?${query}` : ""}`);
}

export function submitUnitTest(unitId, attemptId, answers, timeSpentSeconds = 0) {
  return api.post(`/learning/units/${unitId}/test/${attemptId}/submit`, {
    answers,
    time_spent_seconds: timeSpentSeconds,
  });
}
