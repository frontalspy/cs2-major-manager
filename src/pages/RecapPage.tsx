import { Recap } from "../features/recap";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function RecapPage() {
  useDocumentTitle("Recap");
  return (
    <section>
      <h2>Recap</h2>
      <p className="small mut">
        Every series, veto, MVP and player rating from your run. Updates as you play.
      </p>
      <Recap />
    </section>
  );
}
