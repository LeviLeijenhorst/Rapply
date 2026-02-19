import RevealOnScroll from "@/components/RevealOnScroll";

type SectionContainerProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  disableReveal?: boolean;
};

export default function SectionContainer({
  children,
  className,
  contentClassName,
  disableReveal = false,
}: SectionContainerProps) {
  const sectionContent = (
    <div
      className={`mx-auto w-full max-w-6xl p-6 md:p-10 ${
        contentClassName ?? ""
      }`}
    >
      {children}
    </div>
  );

  return (
    <section className={`w-full ${className ?? ""}`}>
      {disableReveal ? (
        sectionContent
      ) : (
        <RevealOnScroll
          threshold={0.14}
          rootMargin="0px 0px -8% 0px"
          hiddenClassName="translate-y-2 opacity-0"
          visibleClassName="translate-y-0 opacity-100"
          className="motion-reduce:translate-y-0 motion-reduce:opacity-100"
        >
          {sectionContent}
        </RevealOnScroll>
      )}
    </section>
  );
}
