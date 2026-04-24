'use client';

import { useState, useEffect, useRef } from 'react';
import { ProjectGitHubData } from '@/lib/projects';
import ProjectCard from './ProjectCard';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import ProjectReadmeModal from './ProjectReadmeModal';

interface ProjectListProps {
  projects: ProjectGitHubData[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const t = useTranslations('projects');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedProject, setSelectedProject] = useState<ProjectGitHubData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openProject = (project: ProjectGitHubData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Handle hash in URL for selection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = projects.findIndex(p => p.slug === hash);
        if (index !== -1) {
          setFocusedIndex(index);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [projects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < projects.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const project = projects[focusedIndex];
        if (project) {
          openProject(project);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projects, focusedIndex]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.children;
      const focusedElement = children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" ref={listRef}>
        {projects.map((project, index) => {
          const isFocused = index === focusedIndex;
          return (
            <div 
              key={project.slug} 
              onMouseEnter={() => setFocusedIndex(index)}
              style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
              className={`card-enter transition-all duration-200 rounded-2xl h-full ${
                isFocused 
                  ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-bg-dark shadow-lg scale-[1.02]' 
                  : ''
              }`}
            >
              <ProjectCard 
                project={project} 
                onClick={() => openProject(project)}
              />
            </div>
          );
        })}
      </div>

      <ProjectReadmeModal 
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
