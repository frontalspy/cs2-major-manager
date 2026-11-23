import { Bracket } from "../features/bracket";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function BracketPage() {
  useDocumentTitle("Bracket");
  return (
    <section>
      <h2>Bracket</h2>
      <Bracket />
    </section>
  );
}
