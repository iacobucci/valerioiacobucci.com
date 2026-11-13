'use client';

import React, { useRef } from 'react';

export default function SvgHighlightLabel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    const targetText = ref.current.textContent?.trim().toLowerCase();
    if (!targetText) return;

    // Walk backwards in the DOM to find the closest SVG or SVG object above this element
    let el: Element | null = ref.current;
    let foundSvgElements: SVGElement[] = [];

    while (el && foundSvgElements.length === 0) {
      let prev: Element | null = el.previousElementSibling;
      while (prev) {
        // Check objects with contentDocument
        const objects = prev.matches('object') 
          ? [prev] 
          : Array.from(prev.querySelectorAll('object[type="image/svg+xml"]'));

        for (const obj of objects.reverse()) {
          try {
            const svgDoc = (obj as HTMLObjectElement).contentDocument;
            if (svgDoc) {
              const texts = Array.from(svgDoc.querySelectorAll('text, tspan'));
              const match = texts.reverse().find(t => t.textContent?.trim().toLowerCase() === targetText);
              if (match) {
                foundSvgElements.push(match as SVGElement);
                break;
              }
            }
          } catch {}
        }
        if (foundSvgElements.length > 0) break;

        // Check inline SVGs
        const svgs = prev.matches('svg') ? [prev] : Array.from(prev.querySelectorAll('svg'));
        for (const svg of svgs.reverse()) {
          const texts = Array.from(svg.querySelectorAll('text, tspan'));
          const match = texts.reverse().find(t => t.textContent?.trim().toLowerCase() === targetText);
          if (match) {
            foundSvgElements.push(match as SVGElement);
            break;
          }
        }
        if (foundSvgElements.length > 0) break;

        prev = prev.previousElementSibling;
      }

      el = el.parentElement;
      if (el?.tagName === 'ARTICLE' || el?.tagName === 'MAIN') break;
    }

    if (foundSvgElements.length > 0) {
      const match = foundSvgElements[0];
      const origFill = match.style.fill;
      const origFilter = match.style.filter;
      const origTransition = match.style.transition;
      match.setAttribute('data-orig-fill', origFill || '');
      match.setAttribute('data-orig-filter', origFilter || '');
      match.setAttribute('data-orig-transition', origTransition || '');
      match.style.transition = 'all 0.2s ease-in-out';
      match.style.fill = '#2563eb';
      match.style.filter = 'drop-shadow(0 0 6px #3b82f6)';
    }
  };

  const handleMouseLeave = () => {
    document.querySelectorAll('[data-orig-fill]').forEach((el) => {
      const match = el as SVGElement;
      match.style.fill = match.getAttribute('data-orig-fill') || '';
      match.style.filter = match.getAttribute('data-orig-filter') || '';
      match.style.transition = match.getAttribute('data-orig-transition') || '';
      match.removeAttribute('data-orig-fill');
      match.removeAttribute('data-orig-filter');
      match.removeAttribute('data-orig-transition');
    });

    document.querySelectorAll('object[type="image/svg+xml"]').forEach((obj) => {
      try {
        const svgDoc = (obj as HTMLObjectElement).contentDocument;
        svgDoc?.querySelectorAll('[data-orig-fill]').forEach((el) => {
          const match = el as SVGElement;
          match.style.fill = match.getAttribute('data-orig-fill') || '';
          match.style.filter = match.getAttribute('data-orig-filter') || '';
          match.style.transition = match.getAttribute('data-orig-transition') || '';
          match.removeAttribute('data-orig-fill');
          match.removeAttribute('data-orig-filter');
          match.removeAttribute('data-orig-transition');
        });
      } catch {}
    });
  };

  return (
    <span
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-mono font-bold cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors inline-block"
    >
      {children}
    </span>
  );
}
