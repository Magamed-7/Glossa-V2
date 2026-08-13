import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import StoryCard from "../components/stories/StoryCard.jsx";
import WordAudioButton from "../components/ui/WordAudioButton.jsx";
import { useApi } from "../lib/useApi.js";
import { searchStories } from "../lib/api/_pending/search.js";
import { getVocabulary } from "../lib/api/vocabulary.js";
import { createCard } from "../lib/api/deck.js";
import { errorText } from "../lib/api/errorText.js";
import { useToast } from "../lib/toast.jsx";
import { useI18n, useT } from "../lib/i18n.jsx";

function VocabularyRow({ entry }) {
  const t = useT();
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onAdd() {
    setSubmitting(true);
    try {
      await createCard({
        word: entry.word,
        translation: entry.translation,
        example: entry.example_en,
        transcription: entry.transcription,
        audio_url: entry.audio_url,
        accent: entry.accent,
      });
      setAdded(true);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-2 border-tertiary px-5 py-4">
      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-xl">{entry.word}</h3>
          {entry.transcription && (
            <span className="font-mono text-sm text-on-surface-variant italic">/{entry.transcription}/</span>
          )}
          <WordAudioButton audioUrl={entry.audio_url} accent={entry.accent} />
          <span className="font-label text-label-md uppercase text-secondary">{entry.cefr_level}</span>
        </div>
        <p className="font-body text-body-md text-on-surface-variant">{entry.translation}</p>
        {entry.example_en && (
          <p className="font-body text-body-md italic opacity-70">&ldquo;{entry.example_en}&rdquo;</p>
        )}
      </div>
      <NeoButton variant="ghost" size="md" loading={submitting} disabled={added} onClick={onAdd}>
        {added ? t("search.added") : t("search.addToDeck")}
      </NeoButton>
    </div>
  );
}

function StoriesResults({ q }) {
  const t = useT();
  const { data, loading, error } = useApi(() => searchStories(q), [q]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    );
  }

  if (error) return <p className="font-label text-label-md text-error">{errorText(error)}</p>;

  if (!data.items.length) {
    return <EmptyState icon="auto_stories" title={t("search.noStoriesFound")} description={t("search.nothingMatched", { q })} />;
  }

  return (
    <>
      {data.source === "local" && (
        <p className="font-label text-label-md text-on-surface-variant mb-6">{t("search.simplifiedSearch")}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </>
  );
}

function VocabularyResults({ q }) {
  const t = useT();
  const { lang } = useI18n();
  const { data, loading, error } = useApi(() => getVocabulary({ search: q, locale: lang, limit: 50 }), [q, lang]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (error) return <p className="font-label text-label-md text-error">{errorText(error)}</p>;

  if (!data.length) {
    return <EmptyState icon="translate" title={t("search.noWordsFound")} description={t("search.nothingMatched", { q })} />;
  }

  return (
    <div className="space-y-3">
      {data.map((entry) => (
        <VocabularyRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export default function SearchResults() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [tab, setTab] = useState("stories");

  const TABS = [
    { value: "stories", label: t("search.stories") },
    { value: "vocabulary", label: t("search.vocabulary") },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("search.eyebrow")} title={t("search.resultsFor")} accent={`“${q}”`} />
      <div className="mb-8">
        <Tabs id="search-scope" tabs={TABS} value={tab} onChange={setTab} />
      </div>
      {!q ? (
        <EmptyState icon="search" title={t("search.typeToSearch")} description={t("search.tryStoryOrWord")} />
      ) : tab === "stories" ? (
        <StoriesResults q={q} />
      ) : (
        <VocabularyResults q={q} />
      )}
    </div>
  );
}
