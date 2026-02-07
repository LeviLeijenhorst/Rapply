 "use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import styles from "./HomePage.module.css";
import { AnimatedToggleLink } from "@/components/ui/AnimatedToggleLink";

type FrequentlyAskedQuestion = {
  id: string;
  question: string;
  answer: string;
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

const frequentlyAskedQuestions: FrequentlyAskedQuestion[] = [
  {
    id: "veilig",
    question: "Is CoachScribe veilig?",
    answer: "Ja. CoachScribe is ontworpen met veiligheid en privacy als uitgangspunt.",
  },
  {
    id: "training",
    question: "Worden er AI modellen getraind met mijn informatie?",
    answer: "Nee. Je data is van jou en wordt niet gebruikt om modellen te trainen.",
  },
  {
    id: "voor-wie",
    question: "Voor wie is CoachScribe?",
    answer: "Voor coaches en praktijken die gesprekken efficiënt willen vastleggen.",
  },
  {
    id: "vervanging",
    question: "Is CoachScribe een vervanging voor een menselijke coach?",
    answer: "Nee. CoachScribe ondersteunt je werk, maar vervangt geen menselijke coach.",
  },
  {
    id: "chatgpt",
    question: "Kan ik ChatGPT niet gewoon gebruiken?",
    answer: "CoachScribe is gemaakt voor coaching-workflows en veilige verwerking van sessies.",
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Claudia Hiemstra",
    role: "Teamcoach",
    quote:
      "“Het enige nadeel aan CoachScribe, is dat je niet meer zonder kan wanneer je er aan bent gewend. Werkelijk een top tool die goed in elkaar zit.”",
  },
  {
    name: "Christel van Lunsen",
    role: "Loopbaancoach",
    quote:
      "“Het enige nadeel aan CoachScribe, is dat je niet meer zonder kan wanneer je er aan bent gewend. Werkelijk een top tool die goed in elkaar zit.”",
  },
  {
    name: "Rik Strengers",
    role: "Jongerencoach",
    quote:
      "“Het enige nadeel aan CoachScribe, is dat je niet meer zonder kan wanneer je er aan bent gewend. Werkelijk een top tool die goed in elkaar zit.”",
  },
];

export function HomePage() {
  const showTestimonials = false;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFrequentlyAskedQuestionId, setOpenFrequentlyAskedQuestionId] = useState<string | null>(null);
  const mobileMenuCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const focusTimeoutId = window.setTimeout(() => {
      mobileMenuCloseButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsMobileMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          {/* Top navigation */}
          <div className={styles.topNavigation}>
            <Link className={styles.logo} href="/">
              <img
                className={styles.logoIcon}
                alt="Coachscribe logo"
                src="/assets/coachscribe-logo-icon.png"
              />
              <img
                className={styles.logoText}
                alt="Coachscribe"
                src="/assets/coachscribe-logo-text.png"
              />
            </Link>

            <nav className={styles.navigationLinks} aria-label="Navigatie">
              <a className={styles.navigationLink} href="#features">
                Features
              </a>
              <a className={styles.navigationLink} href="#voor-wie">
                Voor wie
              </a>
              <a className={styles.navigationLink} href="#veiligheid">
                Veiligheid
              </a>
              <a className={styles.navigationLink} href="#kennisbank">
                Kennisbank
              </a>
              <a className={styles.navigationLink} href="#prijzen">
                Prijzen
              </a>
            </nav>

            <div className={styles.actions}>
              {/* Mobile menu button */}
              <button
                className={styles.menuButton}
                type="button"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 4.5H21" stroke="#BF0165" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 9.5H12.47" stroke="#BF0165" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 14.5H21" stroke="#BF0165" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 19.5H12.47" stroke="#BF0165" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <span className={styles.desktopActions}>
                <AnimatedToggleLink label="Inloggen" href="#login" variant="outlined" />
                <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOverlayOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          className={styles.mobileMenuBackdrop}
          type="button"
          aria-label="Sluit menu"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={styles.mobileMenuPanel}>
          {/* Mobile menu */}
          <div className={styles.mobileMenuHeader}>
            <div className={styles.mobileMenuTitle}>Menu</div>
            <button
              ref={mobileMenuCloseButtonRef}
              className={styles.mobileMenuClose}
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sluiten
            </button>
          </div>
          <nav className={styles.mobileMenuLinks} aria-label="Mobiele navigatie">
            <a className={styles.mobileMenuLink} href="#features" onClick={() => setIsMobileMenuOpen(false)}>
              Features
            </a>
            <a className={styles.mobileMenuLink} href="#voor-wie" onClick={() => setIsMobileMenuOpen(false)}>
              Voor wie
            </a>
            <a className={styles.mobileMenuLink} href="#veiligheid" onClick={() => setIsMobileMenuOpen(false)}>
              Veiligheid
            </a>
            <a className={styles.mobileMenuLink} href="#kennisbank" onClick={() => setIsMobileMenuOpen(false)}>
              Kennisbank
            </a>
            <a className={styles.mobileMenuLink} href="#prijzen" onClick={() => setIsMobileMenuOpen(false)}>
              Prijzen
            </a>
          </nav>
          <div className={styles.mobileMenuActions}>
            {/* Mobile menu actions */}
            <AnimatedToggleLink label="Inloggen" href="#login" variant="outlined" />
            <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <main id="main">
        <header className={`${styles.container} ${styles.hero}`}>
          <h1 className={styles.heroTitle}>
            Hou je <span className={styles.heroHighlight}>focus</span> op het gesprek,
            <br />
            mis nooit meer een detail
          </h1>
          <p className={styles.heroDescription}>
            Na afloop wordt het gesprek automatisch verwerkt in de template die past bij jouw manier van werken. Klaar om
            te bewaren, te delen of te gebruiken als voorbereiding op het volgende gesprek.
          </p>
          <div className={styles.heroActions}>
            <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" withArrow />
            <AnimatedToggleLink label="Hoe Het Werkt" href="#hoe-het-werkt" variant="outlined" />
          </div>
        </header>

      {/* Video */}
      <section className={`${styles.container} ${styles.videoSection}`} id="hoe-het-werkt">
        <div className={styles.videoCard}>
          <img
            className={styles.videoImage}
            alt="Coachingsessie preview"
            src="https://c.animaapp.com/mkvhzsufsbyOX4/img/rectangle-2985.png"
          />
          <div className={styles.videoOverlay}>
            <img alt="Play" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/play-circle.svg" width={56} height={56} />
          </div>
        </div>
      </section>

      {/* Features title */}
      <section className={`${styles.container} ${styles.featureSection}`} id="features">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleHighlight}>Moderne coaching</span>
          <br />
          was nog nooit zo makkelijk
        </h2>
      </section>

      {/* Feature: record */}
      <section className={`${styles.container} ${styles.featureSection}`}>
        <div className={styles.featureCard}>
          <div>
            <h3 className={styles.featureTextTitle}>
              Record je sessie
              <br />
              met één klik
            </h3>
            <p className={styles.featureTextDescription}>
              Zet de opname aan en focus je volledig op jouw cliënt. CoachScribe neemt het gehele gesprek veilig op
              terwijl jij je bezig houdt met waar je goed in bent; mensen helpen.
            </p>
            <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" withArrow />
          </div>
          <div className={styles.featurePreview} aria-label="Preview opname scherm">
            {/* Preview */}
            <div className={styles.previewLayer} />
            <img
              className={styles.previewImageFull}
              alt="Opname scherm"
              src="/assets/feature-record.png"
            />
          </div>
        </div>
      </section>

      {/* Template selection */}
      <section className={`${styles.container} ${styles.featureSection}`} id="kennisbank">
        <div className={styles.featureCard}>
          <div>
            <h3 className={styles.featureTextTitle}>Selecteer een template</h3>
            <p className={styles.featureTextDescription}>
              Er zijn meerdere templates inbegrepen die je kan gebruiken zodat de sessie wordt vastgelegd zoals jij dat
              wil. Gebruik je liever je eigen template? Geen probleem. CoachScribe is ontworpen om aan te sluiten op
              jouw workflow.
            </p>
            <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" withArrow />
          </div>
          <div className={styles.featurePreview} aria-label="Preview template selectie">
            {/* Preview */}
            <div className={styles.previewLayer} />
            <img
              className={styles.previewImageFull}
              alt="Template selectie"
              src="/assets/feature-template.png"
            />
          </div>
        </div>
      </section>

      {/* Feature: manage */}
      <section className={`${styles.container} ${styles.featureSection}`}>
        <div className={`${styles.featureCard} ${styles.featureCardReverse}`}>
          <div>
            <h3 className={styles.featureTextTitle}>Beheer de sessie</h3>
            <p className={styles.featureTextDescription}>
              Lees het automatische verslag en pas aan waar nodig, stel snelle vragen aan de slimme AI-Chat, maak
              notities en lees of luister specifieke momenten terug uit het gesprek. Genereer verslagen voor jezelf,
              collega’s of de cliënt en exporteer ze direct.
            </p>
            <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" withArrow />
          </div>
          <div className={styles.featurePreview} aria-label="Preview beheer scherm">
            {/* Preview */}
            <div className={styles.previewLayer} />
            <img
              className={styles.previewImageFull}
              alt="Beheer scherm"
              src="/assets/feature-manage.png"
            />
          </div>
        </div>
      </section>

      {/* Testimonials (disabled until we have real reviews) */}
      {showTestimonials ? (
        <section className={`${styles.container} ${styles.testimonialsSection}`} id="voor-wie">
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial) => {
              return (
                <div key={testimonial.name} className={styles.testimonialCard}>
                  {/* Testimonial */}
                  <p className={styles.testimonialQuote}>{testimonial.quote}</p>
                  <div className={styles.testimonialFooter}>
                    <div className={styles.testimonialAvatar} aria-hidden />
                    <div>
                      <p className={styles.testimonialName}>{testimonial.name}</p>
                      <p className={styles.testimonialRole}>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {/* Safety */}
      <section className={styles.safetySection} id="veiligheid">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Ontworpen met <span className={styles.sectionTitleHighlight}>veiligheid</span> op{" "}
            <span className={styles.safetyNumber}>#1</span>
          </h2>
          <div className={styles.safetyGrid}>
            <div className={styles.safetyCard}>
              <div className={styles.safetyCardTitle}>
                <img alt="Security safe" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/security-safe.svg" width={20} height={20} />
                <span>AVG Proof</span>
              </div>
              <p className={styles.safetyCardText}>
                Gegevens worden opgeslagen op EU-gebaseerde servers, met controle over data-export en -verwijdering.
                Transparantie staat centraal in de verwerking van informatie.
              </p>
            </div>
            <div className={styles.safetyCard}>
              <div className={styles.safetyCardTitle}>
                <img alt="Security" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/security.svg" width={20} height={20} />
                <span>SOC 2 Principes</span>
              </div>
              <p className={styles.safetyCardText}>
                Een veilige infrastructuur met strikte toegangscontroles, waarbij privacy by default het uitgangspunt is
                bij elke stap in de verwerking van gegevens.
              </p>
            </div>
            <div className={styles.safetyCard}>
              <div className={styles.safetyCardTitle}>
                <img alt="Security" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/security.svg" width={20} height={20} />
                <span>HIPAA-Bewust</span>
              </div>
              <p className={styles.safetyCardText}>
                Ontworpen met vertrouwelijkheid op zorgniveau als uitgangspunt, zodat gevoelige informatie altijd veilig
                en zorgvuldig wordt behandeld.
              </p>
            </div>
          </div>
          <div className={styles.safetyActions}>
            <AnimatedToggleLink label="Meer informatie" href="#veiligheid" variant="filled" withArrow />
          </div>
        </div>
      </section>

      {/* Always within reach */}
      <section className={`${styles.container} ${styles.handbereikSection}`}>
        <div className={styles.handbereikCard}>
          {/* Always within reach */}
          <div className={styles.handbereikTitle}>Altijd binnen handbereik</div>
          <div className={styles.handbereikContent}>
            <div className={styles.handbereikImages}>
              <img className={styles.handbereikDevices} alt="Laptop en telefoon" src="/assets/phone-and-laptop.png" />
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricingSection} id="prijzen">
        <div className={styles.container}>
          <div className={styles.pricingLayout}>
            <div className={styles.pricingLeft}>
              <h2 className={styles.pricingTitle}>
                Een plan <br />
                dat bij jou past
              </h2>
              <p className={styles.pricingSubtitle}>
                We houden rekening met coaches en praktijken van alle formaten. Kijk rustig even rond, we hebben vast
                een plan dat perfect aansluit op jouw behoeften.
              </p>
            </div>

            <div className={styles.pricingCard}>
              <div className={styles.pricingCardTitle}>Begin gratis</div>
              <div className={styles.pricingCardText}>Krijg toegang tot:</div>
              <div className={styles.pricingList}>
                <div className={styles.pricingListItem}>
                  <div className={styles.pricingCheck}>
                    <img alt="Check" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/check.svg" width={10} height={10} />
                  </div>
                  <span>90 minuten tegoed</span>
                </div>
                <div className={styles.pricingListItem}>
                  <div className={styles.pricingCheck}>
                    <img alt="Check" src="https://c.animaapp.com/mkvhzsufsbyOX4/img/check.svg" width={10} height={10} />
                  </div>
                  <span>Geen creditcard nodig</span>
                </div>
              </div>
              <div className={styles.pricingCardActions}>
                <AnimatedToggleLink label="Probeer Gratis" href="#proberen" variant="filled" withArrow />
              </div>
            </div>

            <div className={styles.pricingCard}>
              <div className={styles.pricingCardTitle}>Plannen vanaf</div>
              <div className={styles.pricingCardPrice}>
                <span className={styles.pricingCardPriceBig}>€15,-</span>
                <span className={styles.pricingCardPriceSmall}>/per maand btw.</span>
              </div>
              <p className={styles.pricingCardDescription}>
                Kijk welk plan het beste bij jou past. Wil je eerst even kijken? De eerste 90 minuten krijg je van ons.
              </p>
              <div className={styles.pricingCardActions}>
                <AnimatedToggleLink label="Bekijk alle plannen" href="#prijzen" variant="filled" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`${styles.container} ${styles.faqSection}`} id="faq">
        <h2 className={styles.sectionTitle}>Veel gestelde vragen</h2>
        <div className={styles.faqList}>
          {frequentlyAskedQuestions.map((frequentlyAskedQuestion) => {
            const isOpen = frequentlyAskedQuestion.id === openFrequentlyAskedQuestionId;

            return (
              <div key={frequentlyAskedQuestion.id} className={styles.faqItem}>
                {/* Frequently asked question */}
                <button
                  className={styles.faqQuestionRow}
                  type="button"
                  onClick={() => setOpenFrequentlyAskedQuestionId(isOpen ? null : frequentlyAskedQuestion.id)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.faqQuestion}>{frequentlyAskedQuestion.question}</div>
                  <div className={styles.faqPlus}>{isOpen ? "−" : "+"}</div>
                </button>
                {isOpen ? <div className={styles.faqAnswer}>{frequentlyAskedQuestion.answer}</div> : null}
              </div>
            );
          })}
        </div>
        <div className={styles.faqActions}>
          <AnimatedToggleLink label="Stel een vraag" href="#contact" variant="filled" />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerBrand}>
                <img className={styles.logoIcon} alt="Coachscribe logo" src="/assets/coachscribe-logo-icon.png" />
                <img className={styles.logoText} alt="Coachscribe" src="/assets/coachscribe-logo-text.png" />
              </div>
              <p className={styles.footerText}>
                CoachScribe neemt sessies op van coaches en zet deze om in praktische verslagen die aansluiten op de
                behoefte van de coach.
                <br />
                <br />
                contact@coachscribe.nl
              </p>
            </div>

            <div>
              <div className={styles.footerTitle}>Navigatie</div>
              <div className={styles.footerLinks}>
                <a className={styles.footerLink} href="#features">
                  Features
                </a>
                <a className={styles.footerLink} href="#loopbaancoaches">Loopbaancoaches</a>
                <a className={styles.footerLink} href="#lifecoaches">Life Coaches</a>
                <a className={styles.footerLink} href="#businesscoaches">Business coaches</a>
                <a className={styles.footerLink} href="#teamcoaches">Teamcoaches</a>
                <a className={styles.footerLink} href="#overigecoaches">Overige coaches</a>
                <a className={styles.footerLink} href="#veiligheid">Veiligheid</a>
                <a className={styles.footerLink} href="#onsverhaal">Ons Verhaal</a>
                <a className={styles.footerLink} href="#blog">Blog</a>
                <a className={styles.footerLink} href="#helpcentrum">Help Centrum</a>
                <a className={styles.footerLink} href="#faq">Veel gestelde vragen</a>
                <a className={styles.footerLink} href="#prijzen">Prijzen</a>
              </div>
            </div>

            <div>
              <div className={styles.footerTitle}>Connect</div>
              <div className={styles.footerLinks}>
                <a className={styles.footerLink} href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
                <a className={styles.footerLink} href="https://www.tiktok.com" target="_blank" rel="noreferrer">
                  TikTok
                </a>
                <a className={styles.footerLink} href="https://www.facebook.com" target="_blank" rel="noreferrer">
                  Facebook
                </a>
                <a className={styles.footerLink} href="https://www.instagram.com" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div className={styles.footerCopyright}>Copyright © 2026 CoachScribe. Alle rechten voorbehouden.</div>
            <div className={styles.footerBottomLinks}>
              <a className={styles.footerBottomLink} href="#privacy">
                Privacybeleid
              </a>
              <a className={styles.footerBottomLink} href="#terms">
                Gebruikersovereenkomst
              </a>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}

