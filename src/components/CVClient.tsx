'use client';

import * as React from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { CVParsedData, parseCVMarkdown } from '@/lib/cv-parser';

import face from '@/app/[locale]/(main)/cv/face.jpg';

const cmunrm = localFont({
  src: '../app/[locale]/(main)/cv/cmunrm.ttf',
  display: 'swap',
});

interface CVClientProps {
  data?: CVParsedData;
  content?: string;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const trimmed = text.trim();
  if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-500 hover:underline"
      >
        {trimmed}
      </a>
    );
  }
  if (/^mailto:[^\s]+$/.test(trimmed)) {
    return (
      <a
        href={trimmed}
        className="text-blue-600 dark:text-blue-500 hover:underline"
      >
        {trimmed.replace(/^mailto:/, '')}
      </a>
    );
  }

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target={linkUrl.startsWith('http') ? '_blank' : undefined}
        rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="text-blue-600 dark:text-blue-500 hover:underline"
      >
        {linkText}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function CVClient({ data: initialData, content }: CVClientProps) {
  const data = React.useMemo(() => {
    if (content) {
      return parseCVMarkdown(content);
    }
    return initialData || {
      title: 'Curriculum Vitae',
      updatedTo: 'Updated to',
      downloadPdf: 'Download PDF',
      image: '/public/cv/face.jpg',
      sections: [],
    };
  }, [initialData, content]);

  const print = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString();
  const displayDate = data.date || today;

  return (
    <div
      className={`${cmunrm.className} max-w-[210mm] mx-auto py-8 m-8 p-4 bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: 210mm 297mm;
              margin: 27mm 16mm 27mm 16mm;
            }

            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }

              body * {
                visibility: hidden;
              }

              #pdf,
              #pdf * {
                visibility: visible;
              }

              #pdf {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
              }

              .page-header,
              .page-footer,
              .no-print {
                display: none;
              }
            }
          `,
        }}
      />
      <div id="pdf" className="print:absolute print:left-0 print:top-0 print:w-[210mm]">
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="flex justify-center items-center mb-6 mt-4">
            <div className="w-1/3 text-right pr-3">
              <h1 className="font-normal text-3xl m-1">{data.title}</h1>
              <h3 id="update" className="font-normal text-base m-1">
                {data.updatedTo} {displayDate}
              </h3>
              <button
                onClick={print}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline print:hidden cursor-pointer"
              >
                {data.downloadPdf}
              </button>
            </div>

            <div className="w-2/3 text-left pl-3">
              <Image
                src={data.image?.replace(/^\/content/, '') || face}
                width={160}
                height={160}
                className="w-40 rounded"
                alt="Face"
                loading="eager"
              />
            </div>
          </div>

          {/* Sections and Items */}
          {data.sections.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              {section.title && <TitleSection title={section.title} />}
              {section.items.map((item, iIdx) => (
                <CVItemRow
                  key={iIdx}
                  label={item.label}
                  lines={item.lines}
                  isSkills={section.isSkills}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function TitleSection({ title }: { title: string }) {
  return (
    <div className="flex items-center mt-6 mb-2">
      <div className="w-1/3 text-right pr-3">
        <h2 className="font-normal m-1 text-2xl">{title}</h2>
      </div>
      <div className="w-2/3 text-left pl-3 pr-6">
        <hr className="border-t-[0.5px] border-fg-light dark:border-fg-dark w-full" />
      </div>
    </div>
  );
}

function CVItemRow({
  label,
  lines,
  isSkills,
}: {
  label: string;
  lines: string[];
  isSkills?: boolean;
}) {
  const labelClass = isSkills
    ? 'font-normal m-1 text-xs'
    : 'font-normal m-1 text-sm';
  const textClass = isSkills
    ? 'font-normal m-1 text-sm'
    : 'font-normal m-1 text-base';

  return (
    <div className="flex items-center">
      <div className="w-1/3 text-right pr-3">
        <h4 className={labelClass}>{label}:</h4>
      </div>
      <div className="w-2/3 text-left pl-3">
        {lines.map((line, idx) => (
          <h3 key={idx} className={textClass}>
            {renderInlineMarkdown(line)}
          </h3>
        ))}
      </div>
    </div>
  );
}
