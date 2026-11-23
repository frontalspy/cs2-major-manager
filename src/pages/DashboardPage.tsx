import { Dashboard } from "../features/dashboard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  return (
    <section>
      <Dashboard />
    </section>
  );
}
