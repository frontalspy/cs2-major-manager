import { Teams } from "../features/teams";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function TeamsPage() {
  useDocumentTitle("Teams");
  return (
    <section>
      <Teams />
    </section>
  );
}
