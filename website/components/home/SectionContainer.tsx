import RevealOnScroll from "@/components/RevealOnScroll";

type SectionContainerProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionContainer({
  children,
  className,
  contentClassName,
}: SectionContainerProps) {
  return (
    <section className={`w-full ${className ?? ""}`}>
      {/* Section content */}
      <RevealOnScroll>
        <div
          className={`mx-auto w-full max-w-6xl p-6 md:p-10 ${
            contentClassName ?? ""
          }`}
        >
          {children}
        </div>
      </RevealOnScroll>
    </section>
  );
}
