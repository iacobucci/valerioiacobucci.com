'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { ProjectGitHubData } from '@/lib/projects';
import ProjectCard from './ProjectCard';
import ProjectReadmeModal from './ProjectReadmeModal';

interface ProjectCarouselProps {
  projects: ProjectGitHubData[];
}

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectGitHubData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openProject = (project: ProjectGitHubData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Use 3 sets to ensure we have plenty of buffer for smooth infinite scrolling
  const duplicatedProjects = useMemo(() => [...projects, ...projects, ...projects], [projects]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    const contentContainer = contentRef.current;
    if (!scrollContainer || !contentContainer) return;

    // Initial position: start at the second set (the middle one)
    const setWidth = contentContainer.scrollWidth / 3;
    scrollContainer.scrollLeft = setWidth;

    let lastTimestamp = 0;
    const scrollSpeed = 0.05; // Pixels per millisecond

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed * delta;

        // The jump point: when we've scrolled through the second set, jump back to start of second set
        if (scrollContainer.scrollLeft >= setWidth * 2) {
          scrollContainer.scrollLeft -= setWidth;
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [projects.length]);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12">
      <div className="relative group rounded-[2.5rem] overflow-hidden py-10">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-bg-light dark:from-bg-dark to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-bg-light dark:from-bg-dark to-transparent pointer-events-none" />

        <div 
          ref={scrollRef}
          className="flex overflow-hidden select-none"
        >
          <div ref={contentRef} className="flex gap-8 px-4">
            {duplicatedProjects.map((project, idx) => (
              <div 
                key={`${project.slug}-${idx}`} 
                className="w-[300px] sm:w-[450px] flex-shrink-0"
              >
                <ProjectCard 
                  project={project} 
                  onClick={() => openProject(project)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProjectReadmeModal 
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
