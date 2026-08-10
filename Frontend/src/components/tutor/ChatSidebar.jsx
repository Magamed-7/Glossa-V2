import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getMyErrors, getSessionAnalysis } from "../../lib/api/ai.js";
import { errorText } from "../../lib/api/errorText.js";
import { useT } from "../../lib/i18n.jsx";

export default function ChatSidebar({ messages, scenario, language, sessionId }) {
  const t = useT();
  const { data: recentErrors } = useApi(() => getMyErrors(), []);
  const [elapsed, setElapsed] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle");

  async function onGetRecommendations() {
    if (!sessionId) return;
    setAnalysisStatus("loading");
    try {
      const result = await getSessionAnalysis(sessionId);
      setAnalysis(result);
      setAnalysisStatus("done");
    } catch (err) {
      setAnalysisStatus("error");
      setAnalysis({ error: errorText(err) });
    }
  }

  useEffect(() => {
    if (!sessionId) return undefined;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const userMessages = messages.filter((m) => m.role === "user" && m.corrections !== null);
  const cleanCount = userMessages.filter((m) => !m.corrections || m.corrections.length === 0).length;
  const accuracy = userMessages.length > 0 ? Math.round((cleanCount / userMessages.length) * 100) : null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="space-y-6">
      <NeoCard>
        <h3 className="font-headline text-headline-md mb-2">{t("tutor.accuracy")}</h3>
        <p className="font-display text-4xl text-secondary">{accuracy === null ? t("common.dash") : `${accuracy}%`}</p>
        <p className="font-body text-body-md opacity-70 mt-1">{t("tutor.thisSession")}</p>
      </NeoCard>

      <NeoCard>
        <h3 className="font-headline text-headline-md mb-4">{t("tutor.recentMistakes")}</h3>
        {recentErrors && recentErrors.length > 0 ? (
          <ul className="space-y-2">
            {recentErrors.slice(0, 5).map((err) => (
              <li key={err.id} className="font-body text-body-md">
                <span className="line-through opacity-60">{err.original}</span>
                <span className="text-secondary">{t("tutor.arrow")}{err.corrected}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-body-md opacity-70">{t("tutor.noMistakes")}</p>
        )}
      </NeoCard>

      <NeoCard variant="accent">
        <h3 className="font-headline text-headline-md mb-2">{t("tutor.session")}</h3>
        <dl className="space-y-2 font-body text-body-md">
          <div className="flex justify-between">
            <dt className="opacity-70">{t("tutor.scenarioLabel")}</dt>
            <dd className="capitalize">{scenario}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">{t("tutor.languageLabel")}</dt>
            <dd>{language}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">{t("tutor.durationLabel")}</dt>
            <dd className="font-ledger">
              {minutes}:{String(seconds).padStart(2, "0")}
            </dd>
          </div>
        </dl>
      </NeoCard>

      <NeoCard>
        <h3 className="font-headline text-headline-md mb-2">{t("tutor.analysisTitle")}</h3>
        {analysisStatus === "done" && analysis && !analysis.error ? (
          <div className="space-y-3">
            <p className="font-body text-body-md">{analysis.recommendation}</p>
            {analysis.topics?.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {analysis.topics.map((topic) => (
                  <li key={topic} className="font-label text-label-md uppercase border border-tertiary px-2 py-1">
                    {topic}
                  </li>
                ))}
              </ul>
            )}
            <p className="font-label text-label-md uppercase text-secondary">
              {t("tutor.analysisXpEarned")}: {analysis.xp_earned}
            </p>
          </div>
        ) : analysisStatus === "loading" ? (
          <p className="font-body text-body-md opacity-70 italic">{t("tutor.analysisLoading")}</p>
        ) : analysisStatus === "error" ? (
          <p className="font-body text-body-md text-error">{analysis?.error || t("tutor.analysisError")}</p>
        ) : (
          <NeoButton variant="ghost" onClick={onGetRecommendations} disabled={!sessionId}>
            {t("tutor.getRecommendations")}
          </NeoButton>
        )}
      </NeoCard>
    </div>
  );
}
