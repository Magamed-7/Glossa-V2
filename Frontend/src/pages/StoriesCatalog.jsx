import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useApi } from "../lib/useApi.js";
import { getStories } from "../lib/api/stories.js";

const LEVEL_TABS = [
  { value: "", label: "All" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
];

export default function StoriesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const level = searchParams.get("level") || "";

  const { data: stories, loading } = useApi(
    () => getStories({ level: level || undefined, limit: 60 }),
    [level]
  );

  function onLevelChange(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("level", value);
    else next.delete("level");
    setSearchParams(next);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Leveled Reading"
        title="The Story"
        accent="Archives"
        subtitle="Read your way up through the CEFR scale, one leveled story at a time."
      />

      <div className="mb-8">
        <Tabs id="story-level" tabs={LEVEL_TABS} value={level} onChange={onLevelChange} />
      </div>

      {!loading && level === "C2" && stories?.length === 0 && (
        <EmptyState
          icon="auto_stories"
          title="C2 material is on its way"
          description="Our most advanced stories are still being written. Check back soon, or keep reading at C1 in the meantime."
        />
      )}

      {!loading && level !== "C2" && stories?.length === 0 && (
        <EmptyState icon="auto_stories" title="No stories at this level yet" />
      )}

      <div>{/* Story grid goes here */}</div>
    </div>
  );
}
