import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { getLegalDocumentContent } from "@/lib/legalDocuments";

export default async function GebruikersovereenkomstPage() {
  const markdown = await getLegalDocumentContent("gebruikersovereenkomst");

  return (
    <LegalDocumentPage
      title="Gebruikersovereenkomst"
      subtitle="De afspraken voor het gebruik van Rapply."
      markdown={markdown}
    />
  );
}
