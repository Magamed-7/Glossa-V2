import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import StoryCard from "../components/stories/StoryCard.jsx";
import { useApi } from "../lib/useApi.js";
import { searchStories } from "../lib/api/_pending/search.js";
import { getVocabulary } from "../lib/api/vocabulary.js";
import { createCard } from "../lib/api/deck.js";
import { errorText } from "../lib/api/errorText.js";
import { useToast } from "../lib/toast.jsx";

const TABS = [
  { value: "stories", label: "Stories" },
  { value: "vocabulary", label: "Vocabulary" },
];

function VocabularyRow({ entry }) {
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onAdd() {
    setSubmitting(true);
    try {
      await createCard({ word: entry.word, translation: entry.translation, example: entry.example_en });
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
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-xl">{entry.word}</h3>
          <span className="font-label text-label-md uppercase text-secondary">{entry.cefr_level}</span>
        </div>
        <p className="font-body text-body-md text-on-surface-variant">{entry.translation}</p>
        {entry.example_en && (
          <p className="font-body text-body-md italic opacity-70">&ldquo;{entry.example_en}&rdquo;</p>
        )}
      </div>
      <NeoButton variant="ghost" size="md" loading={submitting} disabled={added} onClick={onAdd}>
        {added ? "Added" : "Add to Deck"}
      </NeoButton>
    </div>
  );
}

function StoriesResults({ q }) {
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
    return <EmptyState icon="auto_stories" title="No stories found" description={`Nothing matched "${q}".`} />;
  }

  return (
    <>
      {data.source === "local" && (
        <p className="font-label text-label-md text-on-surface-variant mb-6">
          Simplified search — fuzzy matching is unavailable right now, so only titles are checked.
        </p>
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
  const { data, loading, error } = useApi(() => getVocabulary({ search: q, limit: 50 }), [q]);

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
    return <EmptyState icon="translate" title="No words found" description={`Nothing matched "${q}".`} />;
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
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [tab, setTab] = useState("stories");

  return (
    <div>
      <PageHeader eyebrow="Search" title="Results for" accent={`“${q}”`} />
      <div className="mb-8">
        <Tabs id="search-scope" tabs={TABS} value={tab} onChange={setTab} />
      </div>
      {!q ? (
        <EmptyState icon="search" title="Type something to search" description="Try a story title or a word." />
      ) : tab === "stories" ? (
        <StoriesResults q={q} />
      ) : (
        <VocabularyResults q={q} />
      )}
    </div>
  );
}
