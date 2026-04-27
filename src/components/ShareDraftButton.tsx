'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareDraftButtonProps {
  slug: string;
  locale: string;
  passcode?: string;
  isPreviewEnabled: boolean;
}

export default function ShareDraftButton({ slug, locale, passcode, isPreviewEnabled }: ShareDraftButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const origin = window.location.origin;
    let url = `${origin}/${locale}/blog/${slug}`;
    if (passcode) {
      url += `?pwd=${passcode}`;
    }

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPreviewEnabled) return null;

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 ${copied ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share Draft
        </>
      )}
    </button>
  );
}
