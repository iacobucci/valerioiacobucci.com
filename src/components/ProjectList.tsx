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
  
  const [activeTab, setActiveTab] = useState<'sources' | 'forks'>('sources');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedProject, setSelectedProject] = useState<ProjectGitHubData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const sourceProjects = useMemo(() => projects.filter(p => !p.isFork), [projects]);
  const forkProjects = useMemo(() => projects.filter(p => p.isFork), [projects]);
  const activeProjects = useMemo(() => activeTab === 'sources' ? sourceProjects : forkProjects, [activeTab, sourceProjects, forkProjects]);

  const allTechs = useMemo(() => {
    const techs = new Set<string>();
    activeProjects.forEach(p => p.tech.forEach(t => techs.add(t)));
    return Array.from(techs).sort();
  }, [activeProjects]);

  const selectedProjects = useMemo(() => 
    activeProjects.filter(p => p.selected), 
  [activeProjects]);

  const filteredProjects = useMemo(() => {
    let list = activeProjects;
    if (selectedTechs.length === 0) {
      // If no filter, we only show non-selected in the main list
      // to avoid duplication with the featured section
      list = activeProjects.filter(p => !p.selected);
    } else {
      // If filtering, we show everything that matches
      list = activeProjects.filter(p => 
        selectedTechs.every(tech => p.tech.includes(tech))
      );
    }
    return list;
  }, [activeProjects, selectedTechs]);

  const openProject = (project: ProjectGitHubData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Total projects in view for keyboard navigation and hash selection
  const totalInView = useMemo(() => {
    if (selectedTechs.length === 0) {
      // Order matters for index: featured first, then others
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
      const hash = decodeURIComponent(window.location.hash.replace('#', ''));
      if (hash) {
        // Try to find in currently visible projects
        const index = totalInView.findIndex(p => p.github_repo === hash);
        if (index !== -1) {
          setFocusedIndex(index);
        } else {
          // If not in current view, maybe it's filtered out
          const allProjectsOrdered = [...selectedProjects, ...projects.filter(p => !p.selected)];
          const fullIndex = allProjectsOrdered.findIndex(p => p.github_repo === hash);
          
          if (fullIndex !== -1) {
            // Clear filters to show the project
            setSelectedTechs([]);
            // The next effect cycle with [totalInView] will handle focusing
          }
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [projects, totalInView, selectedProjects]); // Re-run when view changes

  // Auto-focus if hash matches but wasn't focused yet (e.g. after filter clear)
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace('#', ''));
    if (hash && focusedIndex === -1) {
      const index = totalInView.findIndex(p => p.github_repo === hash);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [totalInView, focusedIndex]);

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
      {/* Sources / Forks Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80">
          <button
            onClick={() => { setActiveTab('sources'); setSelectedTechs([]); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'sources'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>Sources</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'sources' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300'
            }`}>
              {sourceProjects.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('forks'); setSelectedTechs([]); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'forks'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>Forks</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'forks' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300'
            }`}>
              {forkProjects.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
        <TechFilter 
          allTechs={allTechs}
          selectedTechs={selectedTechs}
          onChange={setSelectedTechs}
        />

        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {t('count', { count: selectedTechs.length === 0 ? activeProjects.length : filteredProjects.length })}
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
