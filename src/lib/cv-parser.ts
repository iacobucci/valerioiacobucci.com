export interface CVItem {
  label: string;
  lines: string[];
}

export interface CVSection {
  title?: string;
  isSkills?: boolean;
  items: CVItem[];
}

export interface CVParsedData {
  title: string;
  updatedTo: string;
  downloadPdf: string;
  image: string;
  date?: string;
  sections: CVSection[];
}

function extractFrontmatter(text: string): { data: Record<string, string>; content: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: text };
  }
  const rawYaml = match[1];
  const content = match[2];
  const data: Record<string, string> = {};
  for (const line of rawYaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      data[key] = val;
    }
  }
  return { data, content };
}

/**
 * Parses CV Markdown with syntax:
 *
 * ### Label
 * Value or description
 * (optional period)
 *
 * ## Section Title
 *
 * ### Next Label
 * ...
 */
export function parseCVMarkdown(rawMdx: string): CVParsedData {
  const { data, content } = extractFrontmatter(rawMdx);

  const lines = content.split('\n');
  const sections: CVSection[] = [];
  let currentSection: CVSection = { items: [] };
  sections.push(currentSection);

  let currentItem: CVItem | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentItem && currentParagraphLines.length > 0) {
      const p = currentParagraphLines.join(' ').trim();
      if (p) {
        currentItem.lines.push(p);
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for ## Section Title (Heading 2)
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushParagraph();
      currentItem = null;
      const title = trimmed.replace(/^##\s+/, '').trim();
      const isSkills = /skill|competen|vaardig/i.test(title);
      currentSection = {
        title,
        isSkills,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    // Check for ### Item Label (Heading 3)
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      const label = trimmed.replace(/^###\s+/, '').replace(/:$/, '').trim();
      currentItem = {
        label,
        lines: [],
      };
      currentSection.items.push(currentItem);
      continue;
    }

    // Empty line flushes the current paragraph in an item
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // If inside an item
    if (currentItem) {
      // If a period line like (2015-2020) appears on its own line, flush previous text first
      if (trimmed.startsWith('(') && trimmed.endsWith(')') && currentParagraphLines.length > 0) {
        flushParagraph();
      }
      currentParagraphLines.push(trimmed);
    }
  }

  flushParagraph();

  // Filter out empty sections
  const validSections = sections.filter(
    (s) => s.items.length > 0 || (s.title && s.title.trim() !== '')
  );

  return {
    title: data.title || 'Curriculum Vitae',
    updatedTo: data.updated_to || 'Updated to',
    downloadPdf: data.download_pdf || 'Download PDF',
    image: data.image || '/public/cv/face.jpg',
    date: data.date,
    sections: validSections,
  };
}
