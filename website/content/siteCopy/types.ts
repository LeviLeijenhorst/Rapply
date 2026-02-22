export type FaqItem = {
  question: string;
  answer: string;
};

export type TextItem = {
  title: string;
  description: string;
};

export type SiteCopy = {
  home: {
    heroTitleLine1: string;
    heroTitleLine2: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    features: TextItem[];
    availabilityTitleLine1: string;
    availabilityTitleLine2: string;
    availabilityTextLine1: string;
    availabilityTextLine2: string;
    faqTitle: string;
    faqItems: FaqItem[];
  };
  shared: {
    securityTitlePrefix: string;
    securityTitleHighlight: string;
    securitySubtitle: string;
    securityCards: TextItem[];
    sectionForProfessionalsTitlePrefix: string;
    sectionForProfessionalsTitleHighlight: string;
    sectionForProfessionalsParagraphs: string[];
    sectionForProfessionalsCta: string;
    footerMicrocopyLine1: string;
    footerMicrocopyLine2: string;
    footerMicrocopyLine3: string;
  };
  product: {
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSubtext: string;
    heroCta: string;
    impactItems: TextItem[];
    faqTitle: string;
    faqItems: FaqItem[];
  };
  coaches: {
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSubtext: string;
    heroCta: string;
    typesSectionTitle: string;
    types: TextItem[];
    workflowTitlePrefix: string;
    workflowTitleHighlight: string;
    workflowParagraphs: string[];
    faqTitle: string;
    faqItems: FaqItem[];
  };
  overOns: {
    heroTitleMain: string;
    heroTitleAccent: string;
    heroSubtext: string;
    heroCta: string;
    values: TextItem[];
    founders: Array<{
      name: string;
      description: string[];
    }>;
    contactHeading: string;
    contactText: string;
  };
};
