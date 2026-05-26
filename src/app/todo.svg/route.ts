import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCachedTodo, setCachedTodo } from '@/lib/todo-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const filePath = path.join(process.cwd(), 'content/todo.txt');
  let content = getCachedTodo();
  
  console.log('GET /todo.svg - Cache hit:', !!content);

  if (!content) {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
      setCachedTodo(content);
    } else {
      content = 'No tasks found';
    }
  }

  const lines = content.split('\n');
  const lineHeight = 32;
  const charWidth = 11.2;
  const padding = 100; // Increased padding for technical borders
  
  // Find the longest line to determine width
  const maxChars = lines.reduce((max, line) => Math.max(max, line.length), 0);
  
  // Calculate SVG dimensions
  const svgHeight = Math.max(400, (lines.length * lineHeight) + padding * 2);
  const svgWidth = Math.max(800, (maxChars * charWidth) + padding * 2);

  const tspans = lines.map((line, index) => {
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    return `<tspan x="${padding}" y="${padding + index * lineHeight}">${escapedLine}</tspan>`;
  }).join('');

  // Generate ruler ticks for top and bottom borders
  let rulerTicks = '';
  for (let x = 40; x <= svgWidth - 40; x += 20) {
    const isMajor = x % 100 === 0;
    const y1 = 40;
    const y2 = isMajor ? 55 : 50;
    const yBottom1 = svgHeight - 40;
    const yBottom2 = isMajor ? svgHeight - 55 : svgHeight - 50;
    rulerTicks += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />`;
    rulerTicks += `<line x1="${x}" y1="${yBottom1}" x2="${x}" y2="${yBottom2}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />`;
  }
  // Generate ruler ticks for left and right borders
  for (let y = 40; y <= svgHeight - 40; y += 20) {
    const isMajor = y % 100 === 0;
    const x1 = 40;
    const x2 = isMajor ? 55 : 50;
    const xRight1 = svgWidth - 40;
    const xRight2 = isMajor ? svgWidth - 55 : svgWidth - 50;
    rulerTicks += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />`;
    rulerTicks += `<line x1="${xRight1}" y1="${y}" x2="${xRight2}" y2="${y}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />`;
  }

  const svg = `
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b3a6e"/>
      <stop offset="100%" stop-color="#124f91"/>
    </linearGradient>

    <radialGradient id="vignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="transparent" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)" />
    </radialGradient>

    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#8fc8ff" stroke-opacity="0.12" stroke-width="1"/>
    </pattern>

    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#smallGrid)"/>
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d9efff" stroke-opacity="0.22" stroke-width="2"/>
    </pattern>
  </defs>

  <!-- Background and Grids -->
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  <rect width="100%" height="100%" fill="url(#vignette)" />

  <!-- Main Technical Borders -->
  <rect x="40" y="40" width="${svgWidth - 80}" height="${svgHeight - 80}" fill="none" stroke="#e6f5ff" stroke-width="2"/>

  <!-- Ruler Ticks -->
  <g>${rulerTicks}</g>

  <style>
    .todo-text {
      fill: rgba(255, 255, 255, 0.95);
      font-size: 18.6667px;
      font-family: 'Geist Mono', monospace;
      white-space: pre;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
  </style>

  <text x="${padding}" y="${padding}" class="todo-text">
    ${tspans}
  </text>
</svg>`.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
