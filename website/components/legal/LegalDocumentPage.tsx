type HeadingBlock = {
  type: "heading";
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
};

type ParagraphBlock = {
  type: "paragraph";
  id: string;
  text: string;
};

type ListBlock = {
  type: "list";
  id: string;
  items: string[];
};

type DividerBlock = {
  type: "divider";
  id: string;
};

type Block = HeadingBlock | ParagraphBlock | ListBlock | DividerBlock;

type LegalDocumentPageProps = {
  title: string;
  subtitle?: string;
  markdown: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function parseMarkdown(markdown: string) {
  const normalized = markdown.replace(/\r/g, "");
  const lines = normalized.split("\n");

  const hasStructuredMarkdown = lines.some((line) => {
    const trimmedLine = line.trim();
    return (
      /^#{1,6}\s+/.test(trimmedLine) ||
      /^-\s+/.test(trimmedLine) ||
      trimmedLine === "---"
    );
  });

  if (!hasStructuredMarkdown) {
    const plainLines = lines.map((line) => line.trim()).filter(Boolean);
    const blocks: Block[] = [];
    let blockIndex = 0;
    let pendingListItems: string[] = [];
    let expectsListItems = false;

    const flushPendingList = () => {
      if (pendingListItems.length === 0) return;
      blocks.push({
        type: "list",
        id: `l-${blockIndex++}`,
        items: [...pendingListItems],
      });
      pendingListItems = [];
    };

    const isLikelyHeading = (value: string) =>
      value.length <= 70 && !/[.:;!?]$/.test(value);

    plainLines.forEach((line, index) => {
      const isHeading = index === 0 || isLikelyHeading(line);

      if (isHeading) {
        flushPendingList();
        blocks.push({
          type: "heading",
          id: `h-${slugify(line)}-${blockIndex++}`,
          level: index === 0 ? 2 : 3,
          text: line,
        });
        expectsListItems = false;
        return;
      }

      if (expectsListItems && line.length <= 140) {
        pendingListItems.push(line);
        return;
      }

      flushPendingList();
      blocks.push({
        type: "paragraph",
        id: `p-${blockIndex++}`,
        text: line,
      });
      expectsListItems = line.endsWith(":");
    });

    flushPendingList();
    return blocks;
  }

  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listLines: string[] = [];
  let blockIndex = 0;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({
      type: "paragraph",
      id: `p-${blockIndex++}`,
      text: paragraphLines.join("\n").trim(),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listLines.length === 0) return;
    blocks.push({
      type: "list",
      id: `l-${blockIndex++}`,
      items: [...listLines],
    });
    listLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmedLine === "---") {
      flushParagraph();
      flushList();
      blocks.push({ type: "divider", id: `d-${blockIndex++}` });
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headingMatch[2].trim();
      blocks.push({
        type: "heading",
        id: `h-${slugify(text)}-${blockIndex++}`,
        level,
        text,
      });
      continue;
    }

    const bulletMatch = trimmedLine.match(/^-\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      listLines.push(bulletMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function repairMojibake(value: string) {
  if (!/[ÃÂâ]/.test(value)) return value;
  try {
    const bytes = Uint8Array.from(value, (character) =>
      character.charCodeAt(0),
    );
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

function renderInline(text: string, keyPrefix: string) {
  const normalizedText = repairMojibake(text);
  const segments = normalizedText
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean);
  return segments.map((segment, index) => {
    const key = `${keyPrefix}-${index}`;
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={key}>{segment.slice(2, -2)}</strong>;
    }
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[0.95em] text-[#243747]"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }
    const lineSegments = segment.split("\n");
    return (
      <span key={key}>
        {lineSegments.map((lineSegment, lineIndex) => (
          <span key={`${key}-line-${lineIndex}`}>
            {lineSegment}
            {lineIndex < lineSegments.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  });
}

export default function LegalDocumentPage({
  title,
  subtitle,
  markdown,
}: LegalDocumentPageProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-base font-normal text-black/70 md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-5 text-base font-normal leading-relaxed text-[#1D0A00]">
            {blocks.map((block) => {
              if (block.type === "divider") {
                return <hr key={block.id} className="border-black/10" />;
              }

              if (block.type === "heading") {
                const classNameByLevel: Record<number, string> = {
                  1: "text-2xl font-semibold text-[#1D0A00]",
                  2: "text-xl font-semibold text-[#1D0A00]",
                  3: "text-lg font-semibold text-[#1D0A00]",
                  4: "text-base font-semibold text-[#1D0A00]",
                  5: "text-base font-semibold text-[#1D0A00]",
                  6: "text-base font-semibold text-[#1D0A00]",
                };
                const headingLevel = Math.min(block.level + 1, 6);
                if (headingLevel === 2) {
                  return (
                    <h2 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                      {renderInline(block.text, block.id)}
                    </h2>
                  );
                }
                if (headingLevel === 3) {
                  return (
                    <h3 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                      {renderInline(block.text, block.id)}
                    </h3>
                  );
                }
                if (headingLevel === 4) {
                  return (
                    <h4 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                      {renderInline(block.text, block.id)}
                    </h4>
                  );
                }
                if (headingLevel === 5) {
                  return (
                    <h5 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                      {renderInline(block.text, block.id)}
                    </h5>
                  );
                }
                if (headingLevel === 6) {
                  return (
                    <h6 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                      {renderInline(block.text, block.id)}
                    </h6>
                  );
                }
                return (
                  <h1 key={block.id} id={block.id} className={classNameByLevel[block.level]}>
                    {renderInline(block.text, block.id)}
                  </h1>
                );
              }

              if (block.type === "list") {
                return (
                  <ul key={block.id} className="list-disc pl-6">
                    {block.items.map((item, itemIndex) => (
                      <li key={`${block.id}-${itemIndex}`}>
                        {renderInline(item, `${block.id}-${itemIndex}`)}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={block.id}>
                  {renderInline(block.text, block.id)}
                </p>
              );
            })}
          </div>
        </article>
        </div>
      </div>
    </section>
  );
}
