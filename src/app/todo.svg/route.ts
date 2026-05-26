import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'content/todo.txt');
  let content = 'No tasks found';

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }

  const lines = content.split('\n');
  const lineHeight = 32;
  const charWidth = 11.2; // Approximate width of a monospace character at 18.6667px
  const padding = 60;

  // Find the longest line to determine width
  const maxChars = lines.reduce((max, line) => Math.max(max, line.length), 0);

  // Calculate SVG dimensions
  const svgHeight = (lines.length * lineHeight) + padding * 2;
  const svgWidth = (maxChars * charWidth) + padding * 2;

  const tspans = lines.map((line, index) => {
    // Escape XML characters
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `<tspan x="${padding}" y="${padding + index * lineHeight}">${escapedLine}</tspan>`;
  }).join('');

  const svg = `
  <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title {
      fill: white;
      font-size: 18.6667px;
      font-family: 'Geist Mono', monospace;
      white-space: pre;
    }
    .bg {
      fill: #0f172a;
    }
  </style>
  <rect class="bg" width="100%" height="100%" rx="24" />
  <text x="${padding}" y="${padding}" class="title">
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
