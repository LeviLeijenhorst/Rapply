function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isMainHeading(line: string) {
  return (
    line === line.toUpperCase() ||
    /^BIJLAGE\s+\d+/i.test(line) ||
    /^\d+\.\s+/.test(line)
  );
}

function isSubHeading(line: string) {
  return /^\d+\.\d+\s+/.test(line) || /^[A-Z]\.\s+/.test(line);
}

function isBullet(line: string) {
  return line.trim().startsWith("- ");
}

function isLabelValueLine(line: string) {
  return /^[^:]{2,40}:\s+.+$/.test(line);
}

async function loadLogoDataUrl() {
  const response = await fetch("/icon.svg");
  if (!response.ok) return null;
  const svgText = await response.text();
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = svgDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export async function downloadVerwerkersovereenkomstPdf(
  documentText: string,
  organizationName: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const topBodyY = 78;
  const bottomY = pageHeight - 56;
  const contentWidth = pageWidth - marginX * 2;
  const logoSize = 26;

  const logoDataUrl = await loadLogoDataUrl();

  const drawPageChrome = () => {
    if (logoDataUrl) {
      try {
        const logoX = pageWidth - marginX - logoSize;
        const logoY = marginX;
        doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);
      } catch {
        // Keep PDF generation resilient if image conversion failed.
      }
    }
    doc.setDrawColor(189, 2, 101);
    doc.line(marginX, pageHeight - 62, pageWidth - marginX, pageHeight - 62);
    doc.setTextColor(96, 96, 96);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  doc.text("Rapply.nl  |  contact@rapply.nl", marginX, pageHeight - 44);
  };

  drawPageChrome();

  let y = topBodyY;

  const ensurePageSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= bottomY) return;
    doc.addPage();
    drawPageChrome();
    doc.setTextColor(29, 10, 0);
    y = topBodyY;
  };

  const drawWrappedText = (
    text: string,
    font: "normal" | "bold",
    fontSize: number,
    lineHeight: number,
  ) => {
    doc.setFont("helvetica", font);
    doc.setFontSize(fontSize);
    doc.setTextColor(29, 10, 0);
    const wrapped = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of wrapped) {
      ensurePageSpace(lineHeight);
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  };

  const lines = documentText.replace(/\r/g, "").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      ensurePageSpace(8);
      y += 8;
      continue;
    }

    const mustStartNewPage =
      /^4\.\s+/.test(line) || /^9\.\s+/.test(line) || /^BIJLAGE\s+1\b/i.test(line);
    if (mustStartNewPage && y !== topBodyY) {
      doc.addPage();
      drawPageChrome();
      doc.setTextColor(29, 10, 0);
      y = topBodyY;
    }

    if (isMainHeading(line)) {
      ensurePageSpace(24);
      y += 6;
      drawWrappedText(line, "bold", 13, 17);
      y += 2;
      continue;
    }

    if (isSubHeading(line)) {
      drawWrappedText(line, "bold", 11.5, 15);
      continue;
    }

    if (isBullet(line)) {
      const bulletText = line.replace(/^- /, "").trim();
      drawWrappedText(`• ${bulletText}`, "normal", 10.8, 14);
      continue;
    }

    if (isLabelValueLine(line)) {
      const separatorIndex = line.indexOf(":");
      const label = line.slice(0, separatorIndex + 1);
      const value = line.slice(separatorIndex + 1).trim();
      drawWrappedText(label, "bold", 10.8, 14);
      drawWrappedText(value, "normal", 10.8, 14);
      continue;
    }

    drawWrappedText(line, "normal", 10.8, 14);
  }

  const fileName = `verwerkersovereenkomst-${slugifyFilename(organizationName || "klant")}.pdf`;
  doc.save(fileName);
}

