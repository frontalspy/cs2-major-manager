import { SquadMental } from "../features/squad";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function SquadPage() {
  useDocumentTitle("Squad & Mental");
  return (
    <section>
      <h2>Squad & Mental</h2>
      <p className="small mut">
        Rating trend and mental per player. One prep talk per player each round: a good one lifts mental and
        gives a rating boost next series, a bad read backfires.
      </p>
      <SquadMental />
    </section>
  );
}
