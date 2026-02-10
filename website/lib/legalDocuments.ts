import { legalContent } from "@/documentation/legal/legalContent";

type DocumentSlug = keyof typeof legalContent;

export async function getLegalDocumentContent(slug: DocumentSlug) {
  return legalContent[slug];
}

export type { DocumentSlug };
