import { MatchCentre } from "../features/match";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function MatchPage() {
  useDocumentTitle("Match Centre");
  return (
    <section>
      <h2>Match Centre</h2>
      <MatchCentre />
    </section>
  );
}
