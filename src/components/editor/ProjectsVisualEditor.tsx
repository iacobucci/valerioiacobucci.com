'use client';

import React, { useMemo, useCallback } from 'react';
import { 
  ArrowUp, ArrowDown, ExternalLink, X, 
  Trash2, Box, Plus 
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';
import { Project, InputDialogProps } from './types';

interface ProjectCardEditorProps {
  project: Project;
  index: number;
  total: number;
  allTechTags: string[];
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  setInputConfig: (config: InputDialogProps | null) => void;
}

export function ProjectCardEditor({ 
  project, index, total, allTechTags, onUpdate, onRemove, onMove, setInputConfig 
}: ProjectCardEditorProps) {
  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all flex flex-col sm:flex-row gap-6">
      {/* Reorder Arrows */}
      <div className="flex sm:flex-col items-center justify-center gap-2 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800">
        <button
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all shadow-sm"
          title="Move Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => onMove(index, 'down')}
          disabled={index === total - 1}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all shadow-sm"
          title="Move Down"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Title</label>
            <input 
              type="text" 
              value={project.title}
              onChange={(e) => onUpdate(index, 'title', e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GitHub Repo</label>
            <div className="relative">
              <FaGithub className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={project.github_repo}
                onChange={(e) => onUpdate(index, 'github_repo', e.target.value)}
                placeholder="user/repo"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Website URL (Optional)</label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={project.website_url || ''}
                onChange={(e) => onUpdate(index, 'website_url', e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Technologies</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {project.tech.map((t: string) => (
                <span key={t} className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1.5 uppercase">
                  {t}
                  <button onClick={() => onUpdate(index, 'tech', project.tech.filter((x: string) => x !== t))}>
                    <X className="w-3 h-3 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs uppercase"
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  if (val && !project.tech.includes(val)) {
                    onUpdate(index, 'tech', [...project.tech, val]);
                    e.target.value = '';
                  }
                }}
                value=""
              >
                <option value="" className="normal-case">Add existing...</option>
                {allTechTags.filter(t => !project.tech.includes(t)).map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
              <button 
                onClick={() => {
                  setInputConfig({
                    isOpen: true,
                    title: "New Tech Tag",
                    placeholder: "e.g. Next.js, Rust...",
                    confirmLabel: "Add Tag",
                    onConfirm: (t) => {
                      setInputConfig(null);
                      const val = t.trim().toLowerCase();
                      if (val && !project.tech.includes(val)) onUpdate(index, 'tech', [...project.tech, val]);
                    },
                    onCancel: () => setInputConfig(null)
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold"
              >
                New
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={project.selected} 
                onChange={(e) => onUpdate(index, 'selected', e.target.checked)}
                className="w-4 h-4 rounded-lg border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-xs font-bold ${project.selected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Featured Project</span>
            </label>
            <div className="flex-1" />
            <button 
              onClick={() => onRemove(index)}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectsVisualEditorProps {
  data: any[];
  onChange: (newData: any[]) => void;
  onRemoveRequest: (index: number) => void;
  setInputConfig: (config: InputDialogProps | null) => void;
  availableTags: string[];
}

export default function ProjectsVisualEditor({ data, onChange, onRemoveRequest, setInputConfig, availableTags }: ProjectsVisualEditorProps) {
  const unifiedTags = useMemo(() => {
    const tags = new Set<string>(availableTags.map(t => t.toLowerCase().trim()));
    data.forEach(p => p.tech?.forEach((t: string) => {
      const normalized = t.toLowerCase().trim();
      if (normalized) tags.add(normalized);
    }));
    return Array.from(tags).sort();
  }, [data, availableTags]);

  const moveProject = useCallback((index: number, direction: 'up' | 'down') => {
    const newData = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  }, [data, onChange]);

  const updateItem = (index: number, field: string, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const addItem = () => {
    const newItem: Project = {
      title: 'New Project',
      github_repo: '',
      tech: [],
      selected: false
    };
    onChange([...data, newItem]);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-500" /> Projects Manager
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {data.map((project, idx) => (
          <ProjectCardEditor 
            key={idx}
            project={project}
            index={idx}
            total={data.length}
            allTechTags={unifiedTags}
            onUpdate={updateItem}
            onRemove={onRemoveRequest}
            onMove={moveProject}
            setInputConfig={setInputConfig}
          />
        ))}
      </div>
    </div>
  );
}
