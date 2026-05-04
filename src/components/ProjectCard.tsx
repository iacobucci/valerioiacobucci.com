'use client';

import React from 'react';
import { FaGithub, FaExternalLinkAlt, FaStar, FaCodeBranch, FaRegGem } from 'react-icons/fa';
import type { ProjectGitHubData } from '@/lib/projects';
import { getLanguageColor } from '@/lib/colors';
import { useTranslations } from 'next-intl';

interface ProjectCardProps {
  project: ProjectGitHubData;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const t = useTranslations('projects');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const hasStats = !project.error && (project.stars > 0 || project.forks > 0 || project.language);
  
  const translationKey = (project.github_repo.split('/').pop() || '').replaceAll('.', '-');

  const title = t.has(`list.${translationKey}.title`) 
    ? t(`list.${translationKey}.title`) 
    : project.title;
    
  const description = t.has(`list.${translationKey}.description`) 
    ? t(`list.${translationKey}.description`) 
    : project.description;

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group bg-white dark:bg-gray-900 rounded-2xl border ${
        project.selected 
          ? 'border-gray-300 dark:border-gray-700 bg-blue-50/20 dark:bg-blue-900/5' 
          : 'border-gray-100 dark:border-gray-800'
      } p-6 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 flex flex-col h-full text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="flex flex-col gap-1">
          {project.selected && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <FaRegGem size={10} />
              {t('featured_badge') || 'Featured'}
            </span>
          )}
          <h3 className={`text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${project.selected ? 'text-blue-950 dark:text-blue-50' : ''}`}>
            {title}
          </h3>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              title={t('website')}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <FaExternalLinkAlt size={12} />
              <span>{t('visit_website')}</span>
            </a>
          )}
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            title={t('github')}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <FaGithub size={20} />
          </a>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {project.tech.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
          >
            {tech.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
        {hasStats ? (
          <>
            {project.language && (
              <span className="flex items-center gap-1.5">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getLanguageColor(project.language) }}
                ></span>
                {project.language}
              </span>
            )}
            {project.stars > 0 && (
              <span className="flex items-center gap-1">
                <FaStar size={14} className="text-yellow-500" />
                {project.stars}
              </span>
            )}
            {project.forks > 0 && (
              <span className="flex items-center gap-1">
                <FaCodeBranch size={14} className="text-gray-400" />
                {project.forks}
              </span>
            )}
          </>
        ) : (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <FaGithub size={16} />
            {t('github')}
          </a>
        )}
      </div>
    </div>
  );
}
