import PageHeader from "../components/layout/PageHeader.jsx";

export default function StoriesCatalog() {
  return (
    <div>
      <PageHeader
        eyebrow="Leveled Reading"
        title="The Story"
        accent="Archives"
        subtitle="Read your way up through the CEFR scale, one leveled story at a time."
      />
      <div>{/* Level tabs and story grid go here */}</div>
    </div>
  );
}
