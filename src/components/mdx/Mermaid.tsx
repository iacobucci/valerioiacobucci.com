'use client';

import React, { useEffect, useState } from 'react';
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

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        try {
          // Validate first to avoid Mermaid's internal error rendering
          await mermaid.parse(chart);
          
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
          setError(null);
        } catch (err) {
          // Surgical cleanup: only remove elements that match this specific ID
          // Mermaid sometimes prefixes IDs or creates hidden containers
          const stray = document.getElementById(id);
          if (stray) stray.remove();
          
          const bindStray = document.getElementById(`d${id}`);
          if (bindStray) bindStray.remove();
          
          console.error('Mermaid render error for ID:', id, err);
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
