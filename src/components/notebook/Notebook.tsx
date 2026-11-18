'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookProps, NotebookCellData, CellType, CellOutput, NotebookFileData } from './types';
import { NotebookCell } from './NotebookCell';
import { NotebookSession } from './runtime';
import { registerNotebookVimCommands } from './vim';
import { getNotebookAction, saveNotebookAction } from '@/lib/actions/notebook';
import { Play, RotateCcw, Plus, Lock, Unlock, Terminal, Save, Check, FileJson } from 'lucide-react';

function parseRawChildren(children: React.ReactNode): NotebookCellData[] {
  if (!children) return [];

  if (typeof children === 'string') {
    const text = children.trim();
    if (!text) return [];

    const cellDelimRegex = /(?:^|\n)(?:#|\/\/)\s*%%\s*(?:\[(markdown|code)\])?\s*\n/;
    const parts = text.split(cellDelimRegex);

    if (parts.length > 1) {
      const parsed: NotebookCellData[] = [];
      let i = 0;
      if (parts[0].trim()) {
        parsed.push({
          id: `cell-${Date.now()}-${Math.random()}`,
          type: 'code',
          source: parts[0].trim(),
          executionCount: null,
          status: 'idle',
          outputs: [],
        });
        i = 1;
      } else {
        i = 1;
      }

      while (i < parts.length) {
        const typeStr = parts[i];
        const source = parts[i + 1] || '';
        const type: CellType = typeStr === 'markdown' ? 'markdown' : 'code';

        if (source.trim()) {
          parsed.push({
            id: `cell-${Date.now()}-${Math.random()}`,
            type,
            source: source.trim(),
            executionCount: null,
            status: 'idle',
            outputs: [],
          });
        }
        i += 2;
      }
      return parsed;
    }

    return [
      {
        id: `cell-${Date.now()}-${Math.random()}`,
        type: 'code',
        source: text,
        executionCount: null,
        status: 'idle',
        outputs: [],
      },
    ];
  }

  const parsed: NotebookCellData[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps = child.props as {
        type?: CellType;
        children?: React.ReactNode;
        source?: string;
        content?: string;
      };
      const type: CellType = childProps.type === 'markdown' ? 'markdown' : 'code';
      const source = typeof childProps.children === 'string'
        ? childProps.children
        : childProps.source || childProps.content || '';

      if (source.trim()) {
        parsed.push({
          id: `cell-${Date.now()}-${Math.random()}`,
          type,
          source: source.trim(),
          executionCount: null,
          status: 'idle',
          outputs: [],
        });
      }
    }
  });

  return parsed;
}

export const Notebook: React.FC<NotebookProps> = ({
  src,
  title: initialTitle,
  initialData,
  resolvedPath: initialResolvedPath,
  slug,
  isAuthor = false,
  editable: defaultEditable = true,
  autoRun = true,
  cells: propCells,
  initialCells: propInitialCells,
  children,
  className = '',
  onSave: customOnSave,
}) => {
  const [title, setTitle] = useState(initialTitle || initialData?.title || 'Interactive TypeScript Notebook');
  const [resolvedPath, setResolvedPath] = useState<string | null>(initialResolvedPath || (src ? src : null));
  const [isEditable, setIsEditable] = useState(defaultEditable);
  const [vimMode, setVimMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notebook_vim_mode');
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return true;
  });
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [, setExecutionCounter] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleVimMode = useCallback(() => {
    setVimMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('notebook_vim_mode', String(next));
      }
      return next;
    });
  }, []);

  // Initialize cells state
  const [cells, setCells] = useState<NotebookCellData[]>(() => {
    // 1. If initialData provided from SSR
    if (initialData?.cells && initialData.cells.length > 0) {
      return initialData.cells.map((c, idx) => ({
        id: `cell-${idx}-${Math.random()}`,
        type: c.type || 'code',
        source: c.source || '',
        executionCount: null,
        status: 'idle',
        outputs: [],
      }));
    }

    // 2. If inline cells provided
    const raw = propCells || propInitialCells;
    if (raw && raw.length > 0) {
      return raw.map((c, idx) => ({
        id: `cell-${idx}-${Math.random()}`,
        type: c.type || 'code',
        source: (c.source ?? c.content ?? '').trim(),
        executionCount: null,
        status: 'idle',
        outputs: [],
      }));
    }

    // 3. If children provided
    const fromChildren = parseRawChildren(children);
    if (fromChildren.length > 0) return fromChildren;

    // 4. Default placeholder cells
    return [
      {
        id: `cell-init-0`,
        type: 'markdown',
        source: '### Welcome to the Notebook\nRun the cell below or edit the code directly in your browser!',
        executionCount: null,
        status: 'idle',
        outputs: [],
      },
      {
        id: `cell-init-1`,
        type: 'code',
        source: '// TypeScript execution in browser\nconst x: number = 42;\nconsole.log("Hello from Notebook! x =", x);\nx * 2;',
        executionCount: null,
        status: 'idle',
        outputs: [],
      },
    ];
  });

  // Client-side fetch for notebooks when src is present and initialData was not provided
  useEffect(() => {
    if (!src || initialData) return;

    let isMounted = true;
    getNotebookAction(src, slug).then((res) => {
      if (!isMounted) return;
      if (res.data) {
        if (res.data.title) setTitle(res.data.title);
        if (res.relativePath) setResolvedPath(res.relativePath);
        if (Array.isArray(res.data.cells) && res.data.cells.length > 0) {
          setCells(
            res.data.cells.map((c, idx) => ({
              id: `cell-${idx}-${Math.random()}`,
              type: c.type || 'code',
              source: c.source || '',
              executionCount: null,
              status: 'idle',
              outputs: [],
            }))
          );
        }
      } else if (res.relativePath) {
        setResolvedPath(res.relativePath);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src, slug, initialData]);

  // Persistent session instance
  const [session] = useState(() => new NotebookSession());

  // Keep cells ref synchronized so runCell always accesses latest cell source synchronously
  const cellsRef = useRef<NotebookCellData[]>(cells);
  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  // Execute a single cell
  const runCell = useCallback(
    async (cellId: string, overrideSource?: string) => {
      const currentCells = cellsRef.current;
      const targetCell = currentCells.find((c) => c.id === cellId);
      if (!targetCell) return;

      if (targetCell.type === 'markdown') {
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, isEditing: false } : c))
        );
        return;
      }

      const cellSource = overrideSource ?? targetCell.source;

      setCells((prev) =>
        prev.map((c) => {
          if (c.id === cellId) {
            return {
              ...c,
              status: 'running',
              outputs: [],
              isEditing: false,
            };
          }
          return c;
        })
      );

      const collectedOutputs: CellOutput[] = [];
      const handleOutput = (out: CellOutput) => {
        collectedOutputs.push(out);
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, outputs: [...collectedOutputs] } : c))
        );
      };

      let execNum = 0;
      setExecutionCounter((cnt) => {
        execNum = cnt;
        return cnt + 1;
      });

      const { error } = await session.execute(cellSource, handleOutput);

      setCells((prev) =>
        prev.map((c) => {
          if (c.id === cellId) {
            return {
              ...c,
              status: error ? 'error' : 'success',
              executionCount: execNum,
              outputs: [...collectedOutputs],
            };
          }
          return c;
        })
      );
    },
    [session]
  );

  // Run all cells sequentially
  const runAllCells = useCallback(async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);

    const currentCells = cellsRef.current;
    for (const cell of currentCells) {
      if (cell.type === 'code') {
        await runCell(cell.id);
      }
    }

    setIsRunningAll(false);
  }, [isRunningAll, runCell]);

  // Restart kernel (clear state and outputs)
  const restartKernel = useCallback(() => {
    session.reset();
    setExecutionCounter(1);
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        executionCount: null,
        status: 'idle',
        outputs: [],
      }))
    );
  }, [session]);

  // Auto-run on mount if autoRun is true
  const hasAutoRunRef = useRef(false);
  useEffect(() => {
    if (autoRun && !hasAutoRunRef.current && cells.length > 0) {
      hasAutoRunRef.current = true;
      runAllCells();
    }
  }, [autoRun, runAllCells, cells.length]);

  // Save Notebook action (when editing in preview)
  const handleSaveNotebook = useCallback(async () => {
    if (!src && !customOnSave) return;
    setIsSaving(true);
    setSaveError(null);

    const fileData: NotebookFileData = {
      title,
      cells: cells.map((c) => ({
        type: c.type,
        source: c.source,
      })),
    };

    try {
      if (customOnSave) {
        const res = await customOnSave(fileData);
        if (res.success) {
          setHasUnsavedChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } else {
          setSaveError(res.error || 'Failed to save');
        }
      } else if (src) {
        const res = await saveNotebookAction(src, fileData, slug);
        if (res.success) {
          setResolvedPath(res.path);
          setHasUnsavedChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } else {
          setSaveError(res.error || 'Failed to save notebook file');
        }
      }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setSaveError(e.message);
    } finally {
      setIsSaving(false);
    }
  }, [src, title, cells, slug, customOnSave]);

  // Global Ctrl+S keyboard shortcut inside notebook
  useEffect(() => {
    if (!isAuthor || (!src && !customOnSave)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveNotebook();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthor, src, customOnSave, handleSaveNotebook]);

  // Initialize Vim Ex commands once on client
  useEffect(() => {
    registerNotebookVimCommands();
  }, []);

  // Listen to custom Vim Ex commands (:w to save, :r to run)
  useEffect(() => {
    const handleVimSave = () => {
      if (isAuthor && (src || customOnSave)) {
        handleSaveNotebook();
      }
    };
    const handleVimRun = () => {
      if (selectedCellId) {
        runCell(selectedCellId);
      }
    };

    window.addEventListener('notebook-save', handleVimSave);
    window.addEventListener('notebook-run-selected', handleVimRun);

    return () => {
      window.removeEventListener('notebook-save', handleVimSave);
      window.removeEventListener('notebook-run-selected', handleVimRun);
    };
  }, [isAuthor, src, customOnSave, handleSaveNotebook, selectedCellId, runCell]);

  // Cell manipulation helpers
  const addCell = (type: CellType, atIndex?: number) => {
    const newCell: NotebookCellData = {
      id: `cell-${Date.now()}-${Math.random()}`,
      type,
      source: type === 'code' ? '// New code cell\n' : '### New markdown cell\nDouble click to edit.',
      executionCount: null,
      status: 'idle',
      outputs: [],
      isEditing: type === 'markdown',
    };

    setCells((prev) => {
      if (atIndex === undefined) return [...prev, newCell];
      const copy = [...prev];
      copy.splice(atIndex, 0, newCell);
      return copy;
    });
    setSelectedCellId(newCell.id);
    setHasUnsavedChanges(true);
  };

  const deleteCell = (cellId: string) => {
    setCells((prev) => prev.filter((c) => c.id !== cellId));
    setHasUnsavedChanges(true);
  };

  const moveCell = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cells.length) return;

    setCells((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const updateCellSource = (cellId: string, newSource: string) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, source: newSource } : c))
    );
    setHasUnsavedChanges(true);
  };

  const updateCellType = (cellId: string, newType: CellType) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? {
              ...c,
              type: newType,
              isEditing: newType === 'markdown',
              outputs: newType === 'markdown' ? [] : c.outputs,
            }
          : c
      )
    );
    setHasUnsavedChanges(true);
  };

  const toggleEditMarkdown = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId && c.type === 'markdown'
          ? { ...c, isEditing: !c.isEditing }
          : c
      )
    );
  };

  return (
    <div
      className={`my-8 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 overflow-hidden font-sans ${className}`}
    >
      {/* Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        {/* Left: Title, File Reference & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h3>
              {resolvedPath && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  title={`Referenced file: ${resolvedPath}`}
                >
                  <FileJson className="w-3 h-3 text-amber-500" />
                  <span className="truncate max-w-[150px]">{resolvedPath}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunningAll ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>TypeScript 5 • Browser Session</span>
              {vimMode && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">• Vim mode active</span>
              )}
              {hasUnsavedChanges && isAuthor && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">• Unsaved changes</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Author Save Button (shown in preview mode when authorized) */}
          {isAuthor && (src || customOnSave) && (
            <button
              onClick={handleSaveNotebook}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 border ${
                saveSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
              title={
                hasUnsavedChanges
                  ? 'Save changes to external notebook file (Ctrl+S)'
                  : 'Notebook file is up to date'
              }
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving...' : 'Save File'}</span>
                </>
              )}
            </button>
          )}

          {/* Run All Button */}
          <button
            onClick={runAllCells}
            disabled={isRunningAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 disabled:opacity-50"
            title="Execute all cells sequentially"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>Run All</span>
          </button>

          {/* Restart Kernel */}
          <button
            onClick={restartKernel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reset notebook state and clear outputs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Add Cell Buttons (when editable) */}
          {isEditable && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => addCell('code')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Add code cell at end"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Code</span>
              </button>
              <button
                onClick={() => addCell('markdown')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Add markdown cell at end"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Markdown</span>
              </button>
            </div>
          )}

          {/* Vim Mode Toggle */}
          <button
            onClick={toggleVimMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-xl border transition-colors ${
              vimMode
                ? 'bg-amber-500/15 dark:bg-amber-400/15 border-amber-500/50 text-amber-700 dark:text-amber-300'
                : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={
              vimMode
                ? 'Vim Mode: ON (h,j,k,l, :w save, :r run) - Click to disable'
                : 'Vim Mode: OFF - Click to enable modal Vim commands'
            }
          >
            <span className="font-bold">VIM</span>
            <span className="text-[10px] hidden sm:inline">{vimMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Editable Toggle */}
          <button
            onClick={() => setIsEditable((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isEditable
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={isEditable ? 'Editing Enabled (Click to lock)' : 'Locked (Click to enable editing)'}
          >
            {isEditable ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Editable</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Locked</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Error Banner */}
      {saveError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 text-xs font-mono text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>Error saving: {saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-red-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Cells List */}
      <div className="p-2 sm:p-4 divide-y divide-gray-100 dark:divide-gray-900">
        {cells.map((cell, idx) => (
          <React.Fragment key={cell.id}>
            <NotebookCell
              cell={cell}
              index={idx}
              isEditable={isEditable}
              isSelected={selectedCellId === cell.id}
              vimMode={vimMode}
              onSelect={() => setSelectedCellId(cell.id)}
              onRun={() => runCell(cell.id)}
              onChangeSource={(newSrc) => updateCellSource(cell.id, newSrc)}
              onChangeType={(newType) => updateCellType(cell.id, newType)}
              onDelete={() => deleteCell(cell.id)}
              onMoveUp={idx > 0 ? () => moveCell(idx, 'up') : undefined}
              onMoveDown={idx < cells.length - 1 ? () => moveCell(idx, 'down') : undefined}
              onToggleEditMarkdown={() => toggleEditMarkdown(cell.id)}
            />

            {/* Quick in-between cell adder (shown when editable and hovering) */}
            {isEditable && (
              <div className="relative h-2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity my-1 z-10 group">
                <div className="absolute inset-x-0 h-px bg-gray-200 dark:bg-gray-800" />
                <div className="relative flex items-center gap-1 bg-white dark:bg-gray-950 px-2">
                  <button
                    onClick={() => addCell('code', idx + 1)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded border border-gray-200 dark:border-gray-800 hover:border-blue-400 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> Code
                  </button>
                  <button
                    onClick={() => addCell('markdown', idx + 1)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded border border-gray-200 dark:border-gray-800 hover:border-emerald-400 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> MD
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 font-mono">
        <div className="flex items-center gap-2">
          <span>{cells.length} cells • Shift+Enter to run</span>
          {resolvedPath && isAuthor && (
            <span className="text-gray-400 dark:text-gray-600 hidden sm:inline">• File: {resolvedPath}</span>
          )}
        </div>
        <span>Local Browser Sandbox</span>
      </div>
    </div>
  );
};

export const NotebookCellItem: React.FC<{
  type?: CellType;
  source?: string;
  content?: string;
  children?: React.ReactNode;
}> = () => {
  return null;
};
