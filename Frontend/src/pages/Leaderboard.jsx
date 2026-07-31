import PageHeader from "../components/layout/PageHeader.jsx";

export default function Leaderboard() {
  return (
    <div>
      <PageHeader
        eyebrow="Global Standing"
        title="The Global"
        accent="Ledger"
        subtitle="Where you stand among every learner on Glossa."
      />
      <div>{/* Podium and table go here */}</div>
    </div>
  );
}
