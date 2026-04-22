'use client';

import { useState, useRef } from 'react';
import { createPostAction } from '@/lib/actions/microblog';
import { MdImage, MdSend, MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

export default function MicroblogEditor() {
  const t = useTranslations('microblog');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 140;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('image_too_large'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;
    if (content.length > MAX_CHARS) return;

    setIsSubmitting(true);
    try {
      const result = await createPostAction(content, imagePreview);
      if (result.success) {
        setContent('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charsLeft = MAX_CHARS - content.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('editor_placeholder')}
            className="w-full min-h-[100px] p-3 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 resize-none text-lg"
            disabled={isSubmitting}
          />
          <div className={`absolute bottom-0 right-2 text-xs font-mono ${charsLeft < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {charsLeft}
          </div>
        </div>

        {imagePreview && (
          <div className="relative rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-96">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain" />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              disabled={isSubmitting}
              title={t('add_image')}
            >
              <MdImage className="w-6 h-6" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !imagePreview) || charsLeft < 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-full transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MdSend className="w-5 h-5" />
            )}
            {t('publish')}
          </button>
        </div>
      </form>
    </div>
  );
}
