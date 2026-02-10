type SectionHeadingProps = {
  title: string;
  highlightedTitle?: string;
  description?: string;
  alignment?: "left" | "center";
};

export default function SectionHeading({
  title,
  highlightedTitle,
  description,
  alignment = "center",
}: SectionHeadingProps) {
  const alignmentClasses =
    alignment === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex w-full flex-col gap-3 ${alignmentClasses}`}>
      {/* Section title */}
      <h2 className="text-3xl font-semibold text-black md:text-4xl">
        {title}{" "}
        {highlightedTitle ? (
          <span className="text-[#BD0265]">{highlightedTitle}</span>
        ) : null}
      </h2>
      {/* Section description */}
      {description ? (
        <p className="text-base font-normal text-black/70 md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
