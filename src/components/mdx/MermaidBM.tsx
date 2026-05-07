import { renderMermaidSVG } from 'beautiful-mermaid';

interface MermaidBMProps {
  chart: string;
}

export default function MermaidBM({ chart }: MermaidBMProps) {
  try {
    // We use CSS variables for theming to support light/dark mode without re-rendering
    const svg = renderMermaidSVG(chart, {
      bg: 'var(--background, #ffffff)',
      fg: 'var(--foreground, #000000)',
      accent: 'var(--mermaid-accent, #2563eb)',
      surface: 'color-mix(in srgb, var(--foreground, #000000) 5%, var(--background, #ffffff))',
      border: 'color-mix(in srgb, var(--foreground, #000000) 20%, var(--background, #ffffff))',
      transparent: true,
    });

    return (
      <div
        className="mermaid-container flex justify-center my-8 overflow-x-auto p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  } catch (error) {
    console.error('MermaidServer render error:', error);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 my-6">
        <p className="text-sm font-mono">Failed to render diagram (Server-side)</p>
        <pre className="text-xs mt-2 overflow-x-auto">{chart}</pre>
      </div>
    );
  }
}
