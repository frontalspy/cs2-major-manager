import { CustomTeamBuilder } from "../features/builder";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function BuilderPage() {
  useDocumentTitle("Custom Team");
  return (
    <section>
      <CustomTeamBuilder />
    </section>
  );
}
