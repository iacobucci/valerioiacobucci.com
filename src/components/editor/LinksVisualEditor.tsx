'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Link2, Copy, Check, ExternalLink, Trash2, Plus, 
  Search, RefreshCw, Sparkles, ArrowRight, Globe, AlertCircle, X
} from 'lucide-react';
import { ConfirmModalProps } from './types';
import { toast } from '@/lib/toast';

interface LinksVisualEditorProps {
  data: Record<string, string>;
  onChange: (newData: Record<string, string>) => void;
  setConfirmModal?: (config: ConfirmModalProps | null) => void;
}

function generate32BitHex(existingKeys: string[] = []): string {
  const existingSet = new Set(existingKeys);
  let hex = '';
  do {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      hex = array[0].toString(16).padStart(8, '0');
    } else {
      hex = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    }
  } while (existingSet.has(hex));

  return hex;
}

export default function LinksVisualEditor({ data, onChange, setConfirmModal }: LinksVisualEditorProps) {
  const [newUrl, setNewUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<{ alias: string; url: string } | null>(null);

  // Normalize data entries
  const entries = useMemo(() => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
    return Object.entries(data);
  }, [data]);

  const existingKeys = useMemo(() => entries.map(([k]) => k), [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase().trim();
    return entries.filter(([key, url]) => 
      key.toLowerCase().includes(query) || (typeof url === 'string' && url.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  // Duplicate key detection for validation
  const duplicateKeys = useMemo(() => {
    const keyCounts = new Map<string, number>();
    for (const [key] of entries) {
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
    }
    const duplicates = new Set<string>();
    keyCounts.forEach((count, key) => {
      if (count > 1) duplicates.add(key);
    });
    return duplicates;
  }, [entries]);

  const handleCopy = useCallback((alias: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/url/${alias}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedKey(alias);
        toast.success(`Copied: /url/${alias}`);
        setTimeout(() => setCopiedKey(prev => (prev === alias ? null : prev)), 2000);
      }).catch(() => {
        toast.error("Failed to copy to clipboard");
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedKey(alias);
      toast.success(`Copied: /url/${alias}`);
      setTimeout(() => setCopiedKey(prev => (prev === alias ? null : prev)), 2000);
    }
  }, []);

  const handleCreateShortLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) {
      toast.error("Please enter a destination URL");
      return;
    }

    let finalAlias = useCustomAlias && customAlias.trim() 
      ? customAlias.trim() 
      : generate32BitHex(existingKeys);

    // Sanitize alias (no leading/trailing slashes, replace spaces)
    finalAlias = finalAlias.replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');

    if (!finalAlias) {
      finalAlias = generate32BitHex(existingKeys);
    }

    const updatedData = {
      [finalAlias]: trimmedUrl,
      ...data
    };

    onChange(updatedData);
    setLastGenerated({ alias: finalAlias, url: trimmedUrl });
    setNewUrl('');
    setCustomAlias('');
    setUseCustomAlias(false);
    toast.success(`Created /url/${finalAlias}`);
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const trimmedNewKey = newKey.replace(/^\/+|\/+$/g, '');
    const newObj: Record<string, string> = {};
    
    for (const [k, v] of Object.entries(data)) {
      if (k === oldKey) {
        newObj[trimmedNewKey] = v;
      } else {
        newObj[k] = v;
      }
    }
    onChange(newObj);
  };

  const handleUpdateValue = (key: string, newValue: string) => {
    onChange({
      ...data,
      [key]: newValue
    });
  };

  const handleRegenerateKey = (oldKey: string) => {
    const newHex = generate32BitHex(existingKeys.filter(k => k !== oldKey));
    handleUpdateKey(oldKey, newHex);
    toast.info(`Updated alias to /url/${newHex}`);
  };

  const handleRemove = (keyToRemove: string) => {
    const doRemove = () => {
      const newObj = { ...data };
      delete newObj[keyToRemove];
      onChange(newObj);
      toast.success(`Removed /url/${keyToRemove}`);
      if (lastGenerated?.alias === keyToRemove) {
        setLastGenerated(null);
      }
    };

    if (setConfirmModal) {
      setConfirmModal({
        isOpen: true,
        title: "Remove Short Link",
        message: `Are you sure you want to remove the link "/url/${keyToRemove}"?`,
        confirmLabel: "Remove",
        confirmVariant: "danger",
        onConfirm: () => {
          setConfirmModal(null);
          doRemove();
        },
        onCancel: () => setConfirmModal(null)
      });
    } else {
      if (window.confirm(`Remove link "/url/${keyToRemove}"?`)) {
        doRemove();
      }
    }
  };

  const handleAddNewEmpty = () => {
    const newHex = generate32BitHex(existingKeys);
    onChange({
      [newHex]: '',
      ...data
    });
    toast.info(`Added empty link /url/${newHex}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Link2 className="w-6 h-6" />
            </div>
            <span>Links Shortener</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create 32-bit hex short URLs (<code className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">/url/abcdef01</code>) and manage custom aliases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {entries.length} {entries.length === 1 ? 'link' : 'links'}
          </span>
          <button 
            onClick={handleAddNewEmpty}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-700"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      </div>

      {/* Quick Shortener Generator Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Shorten a URL</span>
          </div>
          <button
            type="button"
            onClick={() => setUseCustomAlias(!useCustomAlias)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {useCustomAlias ? "Use 32-bit hex generator" : "+ Custom alias"}
          </button>
        </div>

        <form onSubmit={handleCreateShortLink} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste destination URL (e.g. https://example.com/very/long/article)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm font-mono"
              />
              {newUrl && (
                <button
                  type="button"
                  onClick={() => setNewUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {useCustomAlias && (
              <div className="relative sm:w-56">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 font-bold">
                  /url/
                </span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="custom-alias"
                  className="w-full pl-12 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!newUrl.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shrink-0"
            >
              <Link2 className="w-4 h-4" />
              <span>Shorten</span>
            </button>
          </div>
        </form>

        {/* Last generated preview banner */}
        {lastGenerated && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="space-y-1 overflow-hidden">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Short URL Ready
              </div>
              <div className="flex items-center gap-2 text-sm font-mono font-bold text-gray-900 dark:text-white">
                <span>/url/{lastGenerated.alias}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate text-xs text-gray-500 dark:text-gray-400 font-normal">{lastGenerated.url}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(lastGenerated.alias)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                {copiedKey === lastGenerated.alias ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === lastGenerated.alias ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <a
                href={`/url/${lastGenerated.alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Associations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>All Associations</span>
            <span className="text-xs text-gray-400 font-normal">
              ({filteredEntries.length} {filteredEntries.length === entries.length ? 'total' : `of ${entries.length}`})
            </span>
          </h3>

          {/* Search bar */}
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by alias or URL..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List of Link Cards */}
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white/50 dark:bg-gray-900/50">
            <Link2 className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
              {searchQuery ? `No links matching "${searchQuery}"` : "No links created yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? "Try clearing your search query" : "Paste a destination URL above or click Add Row to start."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(([key, url], index) => {
              const isDuplicate = duplicateKeys.has(key);
              const isCopied = copiedKey === key;

              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                >
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                    {/* Key (Alias) Input Group */}
                    <div className="flex-1 min-w-0 lg:max-w-xs space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Key / Alias</span>
                        {isDuplicate && (
                          <span className="text-red-500 flex items-center gap-1 normal-case tracking-normal">
                            <AlertCircle className="w-3 h-3" /> Duplicate key
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className={`relative flex-1 flex items-center rounded-xl bg-gray-50 dark:bg-gray-800 border ${isDuplicate ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'} focus-within:ring-2 focus-within:ring-blue-500`}>
                          <span className="pl-3 text-xs font-mono text-gray-400 font-bold select-none">
                            /url/
                          </span>
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => handleUpdateKey(key, e.target.value)}
                            placeholder="alias"
                            className="w-full pl-1 pr-3 py-2 bg-transparent text-xs font-mono text-gray-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRegenerateKey(key)}
                          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Generate new 32-bit hex alias"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Arrow icon on desktop */}
                    <div className="hidden lg:flex items-center text-gray-300 dark:text-gray-700 pt-4">
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    {/* Value (URL) Input Group */}
                    <div className="flex-[2] min-w-0 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Destination URL
                      </label>
                      <div className="relative flex items-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
                        <Globe className="w-3.5 h-3.5 text-gray-400 ml-3 shrink-0" />
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleUpdateValue(key, e.target.value)}
                          placeholder="https://..."
                          className="w-full pl-2 pr-3 py-2 bg-transparent text-xs font-mono text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Row Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 lg:pt-5 shrink-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => handleCopy(key)}
                        disabled={!key}
                        className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isCopied 
                            ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title="Copy Short URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {key && (
                        <a
                          href={`/url/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Open Short URL (/url/...)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemove(key)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
