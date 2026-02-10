import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { getLegalDocumentContent } from "@/lib/legalDocuments";

export default async function VerwerkersovereenkomstPage() {
  const markdown = await getLegalDocumentContent("verwerkersovereenkomst");

  return (
    <LegalDocumentPage
      title="Verwerkersovereenkomst (voorbeeld)"
      subtitle="Template voor afspraken over gegevensverwerking tussen verwerkingsverantwoordelijke en verwerker."
      markdown={markdown}
    />
  );
}
