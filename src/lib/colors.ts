export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  C: '#555555',
  'C++': '#f34b7d',
  Vue: '#41b883',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  Assembly: '#6E4C13',
  Shell: '#89e051',
  CommonLisp: '#3fb68b',
  Lisp: '#3fb68b',
};

export function getLanguageColor(language?: string): string {
  if (!language) return '#888888';
  return LANGUAGE_COLORS[language] || '#888888';
}
