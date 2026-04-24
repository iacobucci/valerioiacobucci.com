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
  const featuredRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const allTechs = useMemo(() => {
    const techs = new Set<string>();
    projects.forEach(p => p.tech.forEach(t => techs.add(t)));
    return Array.from(techs).sort();
  }, [projects]);

  const selectedProjects = useMemo(() => 
    projects.filter(p => p.selected), 
  [projects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedTechs.length === 0) {
      // If no filter, we only show non-selected in the main list
      // to avoid duplication with the featured section
      list = projects.filter(p => !p.selected);
    } else {
      // If filtering, we show everything that matches
      list = projects.filter(p => 
        selectedTechs.every(tech => p.tech.includes(tech))
      );
    }
    return list;
  }, [projects, selectedTechs]);

  const openProject = (project: ProjectGitHubData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Total projects in view for keyboard navigation
  const totalInView = useMemo(() => {
    if (selectedTechs.length === 0) {
      return [...selectedProjects, ...filteredProjects];
    }
    return filteredProjects;
  }, [selectedProjects, filteredProjects, selectedTechs]);

  // Reset focus when filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [selectedTechs]);

  // Handle hash in URL for selection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = totalInView.findIndex(p => p.github_repo === hash);
        if (index !== -1) {
          setFocusedIndex(index);
        } else {
          // If not in filtered list, check if it exists in all projects
          const fullIndex = projects.findIndex(p => p.github_repo === hash);
          if (fullIndex !== -1) {
            setSelectedTechs([]);
            // Timeout to allow re-render of full list
            setTimeout(() => {
               const newTotal = [...projects.filter(p => p.selected), ...projects.filter(p => !p.selected)];
               const reIndex = newTotal.findIndex(p => p.github_repo === hash);
               setFocusedIndex(reIndex);
            }, 0);
          }
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [projects, totalInView]);

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
        setFocusedIndex(prev => (prev < totalInView.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const project = totalInView[focusedIndex];
        if (project) {
          openProject(project);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalInView, focusedIndex]);

  useEffect(() => {
    if (focusedIndex >= 0) {
      let targetElement: HTMLElement | null = null;
      
      if (selectedTechs.length === 0 && focusedIndex < selectedProjects.length) {
        if (featuredRef.current) {
          targetElement = featuredRef.current.children[focusedIndex] as HTMLElement;
        }
      } else {
        const listIndex = selectedTechs.length === 0 
          ? focusedIndex - selectedProjects.length 
          : focusedIndex;
          
        if (listRef.current && listRef.current.children[listIndex]) {
          targetElement = listRef.current.children[listIndex] as HTMLElement;
        }
      }
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex, selectedTechs.length, selectedProjects.length]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
        <TechFilter 
          allTechs={allTechs}
          selectedTechs={selectedTechs}
          onChange={setSelectedTechs}
        />

        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {selectedTechs.length === 0 ? projects.length : filteredProjects.length} projects
        </div>
      </div>

      {selectedTechs.length === 0 && selectedProjects.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-black text-fg-light dark:text-fg-dark tracking-tight">
              {t('selected_title')}
            </h2>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" ref={featuredRef}>
            {selectedProjects.map((project, index) => {
              const isFocused = index === focusedIndex;
              return (
                <div 
                  key={project.github_repo} 
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`transition-all duration-300 rounded-2xl ${
                    isFocused 
                      ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-bg-dark shadow-xl scale-[1.01]' 
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
        </section>
      )}

      {selectedTechs.length === 0 && (
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-black text-fg-light dark:text-fg-dark tracking-tight">
            {t('featured_title')}
          </h2>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" ref={listRef}>
        {filteredProjects.map((project, index) => {
          const actualIndex = selectedTechs.length === 0 ? index + selectedProjects.length : index;
          const isFocused = actualIndex === focusedIndex;
          return (
            <div 
              key={project.github_repo} 
              onMouseEnter={() => setFocusedIndex(actualIndex)}
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
