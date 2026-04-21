'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    const renderChart = async () => {
      if (chart) {
        const isDarkNow = document.documentElement.classList.contains('dark');
        
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkNow ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });

        try {
          // Generate a unique ID for each chart
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
          setError(null);
        } catch (err) {
          console.error('Mermaid render error:', err);
          setError('Failed to render diagram');
        }
      }
    };

    renderChart();

    // Re-render when theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          renderChart();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 my-6">
        <p className="text-sm font-mono">{error}</p>
        <pre className="text-xs mt-2 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      className="mermaid-container flex justify-center my-8 overflow-x-auto bg-white/50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
