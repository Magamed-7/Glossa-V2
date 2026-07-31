import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import WordCard from "../components/deck/WordCard.jsx";
import AddWordModal from "../components/deck/AddWordModal.jsx";
import DeckStats from "../components/deck/DeckStats.jsx";
import Modal from "../components/ui/Modal.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../lib/toast.jsx";
import { errorText } from "../lib/api/errorText.js";
import { deleteCard, getCards, setCardStatus } from "../lib/api/deck.js";

const STATUS_CYCLE = ["learning", "learned", "hard", "skipped"];

export default function WordDeck() {
  const { data: fetched, loading, error, reload } = useApi(() => getCards({ limit: 24 }), []);
  const [items, setItems] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");
  const toast = useToast();

  useEffect(() => {
    if (fetched) setItems(fetched);
  }, [fetched]);

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get("new")) {
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }

  async function onStatusChange(card) {
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(card.status) + 1) % STATUS_CYCLE.length];
    const previous = items;
    setItems((current) => current.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c)));

    try {
      const updated = await setCardStatus(card.id, nextStatus);
      setItems((current) => current.map((c) => (c.id === card.id ? updated : c)));
    } catch (err) {
      setItems(previous);
      toast.error(errorText(err));
    }
  }

  async function confirmDelete() {
    const card = pendingDelete;
    setPendingDelete(null);
    const previous = items;
    setItems((current) => current.filter((c) => c.id !== card.id));

    try {
      await deleteCard(card.id);
    } catch (err) {
      setItems(previous);
      toast.error(errorText(err));
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
          <DeckStats />
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
            items.map((card) => (
              <WordCard
                key={card.id}
                card={card}
                onStatusChange={onStatusChange}
                onDelete={setPendingDelete}
                onPlayAudio={() => {}}
              />
            ))}
        </div>
      )}

      <AddWordModal open={modalOpen} onClose={closeModal} onCreated={reload} />

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Remove Word">
        <p className="font-body text-body-md mb-6">
          Remove &ldquo;{pendingDelete?.word}&rdquo; from your deck? This can&apos;t be undone.
        </p>
        <div className="flex gap-4">
          <NeoButton variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </NeoButton>
          <NeoButton onClick={confirmDelete}>Remove</NeoButton>
        </div>
      </Modal>
    </div>
  );
}
