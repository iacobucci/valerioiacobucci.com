'use client';

import { useState, useRef } from 'react';
import { createPostAction } from '@/lib/actions/microblog';
import { MdImage, MdSend, MdClose, MdLink, MdOutlineWeb } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { compressImage } from '@/lib/image-utils';

export default function MicroblogEditor() {
  const t = useTranslations('microblog');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isThread, setIsThread] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 140;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(t('image_too_large'));
        return;
      }
      
      setIsCompressing(true);
      try {
        const compressedDataUrl = await compressImage(file);
        setImagePreview(compressedDataUrl);
      } catch (error) {
        console.error('Failed to compress image:', error);
        toast.error('Failed to process image');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;
    if (content.length > MAX_CHARS) return;

    setIsSubmitting(true);
    try {
      const result = await createPostAction(content, imagePreview, isThread, showPreview);
      if (result.success) {
        setContent('');
        setImagePreview(null);
        setIsThread(false);
        setShowPreview(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success('Post published!');
      }
    } catch (error) {
      console.error('Failed to post:', error);
      toast.error('Failed to post');
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
          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              disabled={isSubmitting || isCompressing}
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

            <button
              type="button"
              onClick={() => setIsThread(!isThread)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${isThread
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              title={t('thread')}
            >
              <MdLink className={`w-4 h-4 ${isThread ? 'rotate-45' : ''}`} />
              <span className="hidden sm:inline">{t('thread')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${showPreview
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              title={t('toggle_preview')}
            >
              <MdOutlineWeb className="w-4 h-4" />
              <span className="hidden sm:inline">{t('toggle_preview')}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressing || (!content.trim() && !imagePreview) || charsLeft < 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-full transition-all"
          >
            {isSubmitting || isCompressing ? (
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
