'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectGitHubData } from '@/lib/projects';
import ProjectCard from './ProjectCard';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import ProjectReadmeModal from './ProjectReadmeModal';
import TechFilter from './TechFilter';

interface ProjectListProps {
  projects: ProjectGitHubData[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const t = useTranslations('projects');
  
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedProject, setSelectedProject] = useState<ProjectGitHubData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const allTechs = useMemo(() => {
    const techs = new Set<string>();
    projects.forEach(p => p.tech.forEach(t => techs.add(t)));
    return Array.from(techs).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedTechs.length === 0) return projects;
    // AND logic: project must have ALL selected techs
    return projects.filter(p => 
      selectedTechs.every(tech => p.tech.includes(tech))
    );
  }, [projects, selectedTechs]);

  const openProject = (project: ProjectGitHubData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Reset focus when filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [selectedTechs]);

  // Handle hash in URL for selection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = filteredProjects.findIndex(p => p.slug === hash);
        if (index !== -1) {
          setFocusedIndex(index);
        } else {
          // If not in filtered list, check if it exists in all projects
          const fullIndex = projects.findIndex(p => p.slug === hash);
          if (fullIndex !== -1) {
            setSelectedTechs([]);
            // Timeout to allow re-render of full list
            setTimeout(() => {
               setFocusedIndex(fullIndex);
            }, 0);
          }
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [projects, filteredProjects]);

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
        setFocusedIndex(prev => (prev < filteredProjects.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const project = filteredProjects[focusedIndex];
        if (project) {
          openProject(project);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProjects, focusedIndex]);

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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
        <TechFilter 
          allTechs={allTechs}
          selectedTechs={selectedTechs}
          onChange={setSelectedTechs}
        />

        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" ref={listRef}>
        {filteredProjects.map((project, index) => {
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

      {filteredProjects.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('no_projects')}</p>
        </div>
      )}

      <ProjectReadmeModal 
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
