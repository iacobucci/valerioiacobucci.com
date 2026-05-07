'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FrontmatterData } from './types';

interface FrontmatterModalProps {
  isOpen: boolean;
  data: FrontmatterData;
  availableTags: string[];
  onSave: (data: FrontmatterData) => void;
  onCancel: () => void;
}

export default function FrontmatterModal({ isOpen, data, availableTags, onSave, onCancel }: FrontmatterModalProps) {
  const [formData, setFormData] = useState<FrontmatterData>(data);

  useEffect(() => {
    if (isOpen) setFormData(data);
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleTagAdd = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !formData.tags.includes(normalizedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, normalizedTag] });
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const generatePasscode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({ ...formData, preview_passcode: code, preview: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Article Metadata</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure how this article appears on the site.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none resize-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Published</label>
                <input 
                  type="datetime-local" 
                  value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Updated</label>
                <input 
                  type="datetime-local" 
                  value={formData.updated ? new Date(formData.updated).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, updated: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visibility & Promotion</label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  formData.draft 
                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={formData.draft} 
                    onChange={(e) => setFormData({ ...formData, draft: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-700"
                  />
                  <div>
                    <span className={`block text-sm font-bold ${formData.draft ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>Draft Mode</span>
                    <span className="text-[10px] text-gray-500">Post will not be visible on the public site</span>
                  </div>
                </label>

                <div className={`p-4 rounded-2xl border transition-all ${
                  formData.preview 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={formData.preview} 
                      onChange={(e) => setFormData({ ...formData, preview: e.target.checked })}
                      className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                    />
                    <div>
                      <span className={`block text-sm font-bold ${formData.preview ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>Enable Preview</span>
                      <span className="text-[10px] text-gray-500">Allow access via secret passcode</span>
                    </div>
                  </label>
                  
                  {formData.preview && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={formData.preview_passcode || ''}
                        onChange={(e) => setFormData({ ...formData, preview_passcode: e.target.value })}
                        placeholder="6-digit code"
                        maxLength={6}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={generatePasscode}
                        className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[10px] font-bold transition-colors uppercase"
                      >
                        Generate
                      </button>
                    </div>
                  )}
                </div>

                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  formData.selected 
                    ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={formData.selected} 
                    onChange={(e) => setFormData({ ...formData, selected: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500 border-gray-300 dark:border-gray-700"
                  />
                  <div>
                    <span className={`block text-sm font-bold ${formData.selected ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>Selected Article</span>
                    <span className="text-[10px] text-gray-500">Highlight this article on the homepage</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tags & Categories</label>
              <div className="flex flex-wrap gap-1.5 mb-4 min-h-8">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center gap-2 border border-blue-100 dark:border-blue-900/50 group uppercase">
                    {tag}
                    <button onClick={() => handleTagRemove(tag)} className="hover:text-red-500 transition-colors uppercase">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.tags.length === 0 && <span className="text-[10px] text-gray-400 italic">No tags added</span>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleTagAdd(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                >
                  <option value="" className="normal-case">Existing Tags...</option>
                  {availableTags
                    .map(t => t.toLowerCase().trim())
                    .filter((t, i, arr) => t && arr.indexOf(t) === i) // Unique
                    .filter(t => !formData.tags.map(tag => tag.toLowerCase().trim()).includes(t))
                    .map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                </select>
                <input 
                  type="text" 
                  placeholder="New tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTagAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all active:scale-95">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
