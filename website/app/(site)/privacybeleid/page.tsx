import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { getLegalDocumentContent } from "@/lib/legalDocuments";

export default async function PrivacybeleidPage() {
  const markdown = await getLegalDocumentContent("privacybeleid");

  return (
    <LegalDocumentPage
      title="Privacybeleid"
      subtitle="Heldere informatie over gegevensstromen, rollen, beveiliging en jouw rechten."
      markdown={markdown}
    />
  );
}
