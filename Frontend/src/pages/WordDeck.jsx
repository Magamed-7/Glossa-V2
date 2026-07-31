import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import WordCard from "../components/deck/WordCard.jsx";
import AddWordModal from "../components/deck/AddWordModal.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getCards } from "../lib/api/deck.js";

export default function WordDeck() {
  const { data: cards, loading, error, reload } = useApi(() => getCards({ limit: 24 }), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get("new")) {
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Personal Archive"
        title="Vocabulary"
        accent="Salon"
        subtitle="Every word you collect, tracked through spaced repetition until it becomes second nature."
      />

      {error && <ErrorState error={error} onRetry={reload} />}

      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            type="button"
            className="border-2 border-dashed border-tertiary flex flex-col items-center justify-center gap-2 min-h-[180px] hover:bg-surface-container transition-colors"
            onClick={() => setModalOpen(true)}
          >
            <Icon name="add" className="text-4xl text-tertiary" />
            <span className="font-label text-label-md uppercase">Add New Word</span>
          </button>

          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="min-h-[180px]" />)}

          {!loading &&
            cards?.map((card) => (
              <WordCard
                key={card.id}
                card={card}
                onStatusChange={() => {}}
                onDelete={() => {}}
                onPlayAudio={() => {}}
              />
            ))}
        </div>
      )}

      <AddWordModal open={modalOpen} onClose={closeModal} onCreated={reload} />
    </div>
  );
}
