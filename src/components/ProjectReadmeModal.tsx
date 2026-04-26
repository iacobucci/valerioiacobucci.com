'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import { MDXRemote } from 'next-mdx-remote';
import { mdxComponents } from './mdx-components';
import { getProjectReadmeAction } from '@/lib/actions/projects';
import { ProjectGitHubData } from '@/lib/projects';
import { useTranslations } from 'next-intl';

interface ProjectReadmeModalProps {
  project: ProjectGitHubData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectReadmeModal({ project, isOpen, onClose }: ProjectReadmeModalProps) {
  const t = useTranslations('projects');
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      const fetchReadme = async () => {
        setIsLoading(true);
        setError(null);
        setMdxSource(null);
        try {
          const result = await getProjectReadmeAction(project.github_repo);
          if (result.success) {
            setMdxSource(result.mdxSource);
          } else {
            setError(result.error || t('readme_error'));
          }
        } catch (err) {
          setError(t('readme_error_unexpected'));
        } finally {
          setIsLoading(false);
        }
      };
      fetchReadme();
    }
  }, [isOpen, project, t]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project?.title || project?.github_repo}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project?.github_repo}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{t('readme_loading')}</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800 text-center">
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                  <button 
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-sm font-bold"
                  >
                    {t('close_modal')}
                  </button>
                </div>
              ) : mdxSource ? (
                <article className="prose prose-neutral prose-lg dark:prose-invert max-w-none">
                  <MDXRemote 
                    {...mdxSource} 
                    components={mdxComponents} 
                  />
                </article>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
