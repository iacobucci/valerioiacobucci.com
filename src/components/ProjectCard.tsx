import React from 'react';
import { FaGithub, FaExternalLinkAlt, FaStar, FaCodeBranch } from 'react-icons/fa';
import { ProjectGitHubData } from '@/lib/projects';
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

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 flex flex-col h-full text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex justify-between items-start mb-4 w-full">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {t(`list.${project.slug}.title`)}
        </h3>
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-1"
            title="GitHub"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <FaGithub size={20} />
          </a>
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-1"
              title="Website"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <FaExternalLinkAlt size={18} />
            </a>
          )}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
        {t(`list.${project.slug}.description`)}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {project.tech.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
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
      </div>
    </div>
  );
}
