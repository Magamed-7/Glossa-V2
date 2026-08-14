import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import QuizCard from "../components/quiz/QuizCard.jsx";
import QuizResults from "../components/quiz/QuizResults.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getCourseUnitDetail, generateUnitTest, submitUnitTest } from "../lib/api/learning.js";

const BG = {
  backgroundColor: "var(--color-surface)",
  backgroundImage: "radial-gradient(var(--color-outline-variant, #c6c6cd) 1.5px, transparent 1.5px)",
  backgroundSize: "24px 24px",
};

const T = {
  en: {
    exerciseLabel: "Unit Test",
    title: (name) => `Unit test — ${name}`,
    retry: "Try again",
    back: "Back to unit",
    submitError: "Could not submit the test, try again.",
    genError: "Could not start the test.",
  },
  ru: {
    exerciseLabel: "Тест юнита",
    title: (name) => `Тест по юниту — ${name}`,
    retry: "Ещё раз",
    back: "Назад к юниту",
    submitError: "Не удалось отправить тест, попробуй ещё раз.",
    genError: "Не удалось начать тест.",
  },
  tg: {
    exerciseLabel: "Санҷиши воҳид",
    title: (name) => `Санҷиши воҳид — ${name}`,
    retry: "Такрор",
    back: "Бозгашт ба воҳид",
    submitError: "Санҷишро фиристодан нашуд, бори дигар кӯшиш кун.",
    genError: "Санҷишро оғоз кардан нашуд.",
  },
};

export default function UnitTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const t = T[lang] || T.en;

  const { data: unit } = useApi(() => getCourseUnitDetail(id, { locale: lang }), [id, lang]);

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genError, setGenError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitErr, setSubmitErr] = useState(null);

  async function startAttempt() {
    setLoading(true);
    setGenError(null);
    setResult(null);
    try {
      const data = await generateUnitTest(id, { locale: lang });
      setAttempt(data);
    } catch (err) {
      setGenError(errorText(err) || t.genError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang]);

  async function handleFinish(answers) {
    try {
      const outcome = await submitUnitTest(id, attempt.attempt_id, answers);
      setResult(outcome);
    } catch (err) {
      setSubmitErr(errorText(err) || t.submitError);
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG}>
        <div className="w-full max-w-3xl px-4 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (genError) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <ErrorState error={genError} onRetry={startAttempt} />
      </div>
    );
  }

  if (result) {
    return (
      <QuizResults
        result={result}
        title={t.title(unit?.theme_title || "")}
        passed={result.passed}
        lang={lang}
        gameType="unit_test"
        onRetry={startAttempt}
        onBack={() => navigate(`/roadmap/units/${id}`)}
        retryLabel={t.retry}
        backLabel={t.back}
      />
    );
  }

  return (
    <div className="min-h-screen text-on-surface relative overflow-x-hidden" style={BG}>
      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-12 py-16 pb-24">
        {attempt?.questions?.length > 0 ? (
          <QuizCard
            questions={attempt.questions}
            lang={lang}
            exerciseLabel={t.exerciseLabel}
            onFinish={handleFinish}
          />
        ) : (
          <p className="font-body text-body-md text-center text-on-surface-variant">{t.genError}</p>
        )}

        {submitErr && (
          <p role="alert" className="font-label text-[11px] text-secondary font-bold uppercase mt-4 text-center">
            {submitErr}
          </p>
        )}
      </main>
    </div>
  );
}
