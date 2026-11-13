'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { 
  ArrowUp, ArrowDown, ExternalLink, X, 
  Trash2, Box, Plus 
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';
import { Project, InputDialogProps, ConfirmModalProps } from './types';
import { toast } from '@/lib/toast';

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
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
          title="Move Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => onMove(index, 'down')}
          disabled={index === total - 1}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
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
              <input 
                type="text" 
                value={project.github_repo}
                onChange={(e) => onUpdate(index, 'github_repo', e.target.value)}
                placeholder="user/repo"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <FaGithub className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Website URL (Optional)</label>
            <div className="relative">
              <input 
                type="text" 
                value={project.website_url || ''}
                onChange={(e) => onUpdate(index, 'website_url', e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <ExternalLink className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Technologies</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(project.tech || []).map((t, tIdx) => (
                <span 
                  key={tIdx} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  {t}
                  <button 
                    onClick={() => {
                      const newTech = project.tech.filter((_, i) => i !== tIdx);
                      onUpdate(index, 'tech', newTech);
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              
              <button
                onClick={() => {
                  setInputConfig({
                    isOpen: true,
                    title: "Add Technology Tag",
                    placeholder: "Choose or type tag name...",
                    defaultValue: "",
                    confirmLabel: "Add Tag",
                    onConfirm: (val) => {
                      const tag = val.trim();
                      if (tag && !project.tech?.includes(tag)) {
                        onUpdate(index, 'tech', [...(project.tech || []), tag]);
                      }
                    },
                    onCancel: () => setInputConfig(null)
                  });
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:border-blue-500 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={!!project.selected}
                onChange={(e) => onUpdate(index, 'selected', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Featured Project</span>
            </label>

            <button
              onClick={() => onRemove(index)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectsVisualEditorProps {
  data: any;
  onChange: (newData: any) => void;
  onRemoveRequest?: (index: number) => void;
  setConfirmModal?: (config: ConfirmModalProps | null) => void;
  setInputConfig: (config: InputDialogProps | null) => void;
  availableTags: string[];
}

export default function ProjectsVisualEditor({ 
  data, 
  onChange, 
  onRemoveRequest, 
  setConfirmModal, 
  setInputConfig, 
  availableTags 
}: ProjectsVisualEditorProps) {
  const isStructured = Boolean(data && typeof data === 'object' && !Array.isArray(data));
  const [activeTab, setActiveTab] = useState<'sources' | 'forks'>('sources');

  const currentList: Project[] = useMemo(() => {
    if (isStructured) {
      return (data[activeTab] || []) as Project[];
    }
    return (Array.isArray(data) ? data : []) as Project[];
  }, [data, isStructured, activeTab]);

  const unifiedTags = useMemo(() => {
    const tags = new Set<string>(availableTags.map(t => t.toLowerCase().trim()));
    const allProjects: Project[] = isStructured
      ? [...(data.sources || []), ...(data.forks || [])]
      : (Array.isArray(data) ? data : []);

    allProjects.forEach(p => p.tech?.forEach((t: string) => {
      const normalized = t.toLowerCase().trim();
      if (normalized) tags.add(normalized);
    }));
    return Array.from(tags).sort();
  }, [data, isStructured, availableTags]);

  const updateList = useCallback((newList: Project[]) => {
    if (isStructured) {
      onChange({
        sources: Array.isArray(data?.sources) ? data.sources : [],
        forks: Array.isArray(data?.forks) ? data.forks : [],
        ...data,
        [activeTab]: newList
      });
    } else {
      onChange(newList);
    }
  }, [data, isStructured, activeTab, onChange]);

  const handleRemove = useCallback((index: number) => {
    const doRemove = () => {
      const newList = [...currentList];
      newList.splice(index, 1);
      updateList(newList);
      toast.success("Project removed from list");
    };

    if (setConfirmModal) {
      setConfirmModal({
        isOpen: true,
        title: "Remove Project",
        message: "Are you sure you want to remove this project from the list?",
        confirmLabel: "Remove",
        confirmVariant: "danger",
        onConfirm: () => {
          setConfirmModal(null);
          doRemove();
        },
        onCancel: () => setConfirmModal(null)
      });
    } else if (onRemoveRequest) {
      onRemoveRequest(index);
    } else {
      doRemove();
    }
  }, [currentList, updateList, setConfirmModal, onRemoveRequest]);

  const moveProject = useCallback((index: number, direction: 'up' | 'down') => {
    const newList = [...currentList];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newList.length) return;
    
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    updateList(newList);
  }, [currentList, updateList]);

  const updateItem = (index: number, field: string, value: any) => {
    const newList = [...currentList];
    newList[index] = { ...newList[index], [field]: value };
    updateList(newList);
  };

  const addItem = () => {
    const newItem: Project = {
      title: 'New Project',
      github_repo: '',
      tech: [],
      selected: false
    };
    updateList([...currentList, newItem]);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-500" /> Projects Manager
        </h2>
        
        <div className="flex items-center gap-3">
          {isStructured && (
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sources'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sources ({data.sources?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('forks')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'forks'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Forks ({data.forks?.length || 0})
              </button>
            </div>
          )}

          <button 
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {currentList.map((project, idx) => (
          <ProjectCardEditor 
            key={idx}
            project={project}
            index={idx}
            total={currentList.length}
            allTechTags={unifiedTags}
            onUpdate={updateItem}
            onRemove={handleRemove}
            onMove={moveProject}
            setInputConfig={setInputConfig}
          />
        ))}

        {currentList.length === 0 && (
          <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            No projects in this section. Click &quot;Add Project&quot; above to create one.
          </div>
        )}
      </div>
    </div>
  );
}
