export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(content: string): TocItem[] {
  if (!content) return [];
  // Strip code blocks to avoid extracting # inside code/comments
  const cleaned = content.replace(/```[\s\S]*?```/g, '');
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(cleaned)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();
    // Remove markdown links or formatting from heading text
    const text = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    if (text) {
      items.push({ id, text, level });
    }
  }
  return items;
}
