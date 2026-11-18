'use client';

import React from 'react';

interface NotebookMarkdownProps {
  content: string;
  className?: string;
  onDoubleClick?: () => void;
}

export const NotebookMarkdown: React.FC<NotebookMarkdownProps> = ({
  content,
  className = '',
  onDoubleClick,
}) => {
  // Simple, robust client-side markdown renderer
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for inline code, bold, italic, links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 border border-gray-200 dark:border-gray-700"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Normal text until next special character
      const nextSpecial = remaining.search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial > 0) {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      } else {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block start / end
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={i}
            className={`p-3 my-2 rounded-xl text-xs font-mono bg-gray-900 text-gray-100 dark:bg-gray-950 overflow-x-auto border border-gray-800 ${
              codeBlockLang ? `language-${codeBlockLang}` : ''
            }`}
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">
          {renderInline(line.slice(5))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-extrabold text-gray-900 dark:text-white mt-6 mb-3">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-1 my-2 text-gray-600 dark:text-gray-400 italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-gray-700 dark:text-gray-300 text-sm my-1">
          {renderInline(line.slice(2))}
        </li>
      );
      continue;
    }

    // Numbered List
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-5 list-decimal text-gray-700 dark:text-gray-300 text-sm my-1">
          {renderInline(numMatch[2])}
        </li>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
  }

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`select-text ${className}`}
      title={onDoubleClick ? 'Double-click to edit markdown' : undefined}
    >
      {elements}
    </div>
  );
};
