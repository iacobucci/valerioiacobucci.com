'use client';

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import CodeMirror, { Prec, keymap, EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { vim, Vim, getCM } from '@replit/codemirror-vim';
import { useTheme } from '@/hooks/useTheme';
import { NotebookCellData, CellType } from './types';
import { NotebookPlot } from './NotebookPlot';
import { NotebookTable } from './NotebookTable';
import { NotebookMarkdown } from './NotebookMarkdown';
import { Play, ArrowUp, ArrowDown, Trash2, Check, Edit3, Code2, FileText } from 'lucide-react';

interface NotebookCellProps {
  cell: NotebookCellData;
  index?: number;
  isEditable: boolean;
  isSelected: boolean;
  vimMode?: boolean;
  onSelect: () => void;
  onRun: () => void;
  onChangeSource: (source: string) => void;
  onChangeType: (type: CellType) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleEditMarkdown?: () => void;
}

export const NotebookCell: React.FC<NotebookCellProps> = ({
  cell,
  isEditable,
  isSelected,
  vimMode = false,
  onSelect,
  onRun,
  onChangeSource,
  onChangeType,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleEditMarkdown,
}) => {
  const theme = useTheme();
  const editorViewRef = useRef<EditorView | null>(null);

  // Helper to ensure editor starts/is placed in Insert mode when Vim mode is active
  const ensureInsertMode = useCallback((view?: EditorView | null) => {
    if (!view) return;
    const setMode = () => {
      const cm = getCM(view);
      if (cm && cm.state.vim && !cm.state.vim.insertMode) {
        Vim.handleKey(cm, 'i', 'user');
      }
    };
    setMode();
    requestAnimationFrame(setMode);
  }, []);

  // Sync insert mode when vimMode or isEditable changes
  useEffect(() => {
    if (vimMode && isEditable && editorViewRef.current) {
      ensureInsertMode(editorViewRef.current);
    }
  }, [vimMode, isEditable, ensureInsertMode]);

  // CodeMirror keymap for running cell (Shift+Enter, Ctrl+Enter, Cmd+Enter)
  const runKeymap = useMemo(() => {
    return Prec.highest(
      keymap.of([
        {
          key: 'Shift-Enter',
          run: () => {
            onRun();
            return true;
          },
        },
        {
          key: 'Ctrl-Enter',
          run: () => {
            onRun();
            return true;
          },
        },
        {
          key: 'Mod-Enter',
          run: () => {
            onRun();
            return true;
          },
        },
      ])
    );
  }, [onRun]);

  // Custom editor theme (zero shadows, zero blurs, flat aesthetic)
  const customEditorTheme = useMemo(() => {
    return EditorView.theme({
      '&': {
        fontSize: '13px',
        backgroundColor: 'transparent !important',
      },
      '&.cm-focused': {
        outline: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        lineHeight: '1.6',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent !important',
        border: 'none !important',
        color: '#9ca3af',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '24px',
        paddingRight: '8px',
        fontSize: '11px',
        lineHeight: '1.6',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(59, 130, 246, 0.05) !important',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent !important',
        color: '#3b82f6 !important',
        fontWeight: '600',
      },
      '.cm-vim-panel': {
        padding: '2px 8px',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        backgroundColor: 'rgba(128, 128, 128, 0.08)',
        borderTop: '1px solid rgba(128, 128, 128, 0.2)',
      },
      '.cm-vim-panel input': {
        fontFamily: 'inherit',
        fontSize: '11px',
        outline: 'none',
        border: 'none',
      },
    });
  }, []);

  // Extensions for TypeScript / Code cells
  const codeExtensions = useMemo(() => {
    const exts = [
      javascript({ typescript: true, jsx: true }),
      runKeymap,
      customEditorTheme,
      EditorView.lineWrapping,
    ];
    if (vimMode) {
      exts.push(vim({ status: true }));
    }
    return exts;
  }, [vimMode, runKeymap, customEditorTheme]);

  // Extensions for Markdown cells (when editing)
  const markdownExtensions = useMemo(() => {
    const exts = [
      markdown(),
      runKeymap,
      customEditorTheme,
      EditorView.lineWrapping,
    ];
    if (vimMode) {
      exts.push(vim({ status: true }));
    }
    return exts;
  }, [vimMode, runKeymap, customEditorTheme]);

  return (
    <div
      onClick={onSelect}
      className={`relative group transition-colors border-l-4 ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50/10 dark:bg-blue-950/10'
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
      } py-2 px-3 sm:px-4 my-2 rounded-r-xl`}
    >
      {/* Top action toolbar (visible when editable and cell is selected / hovered) */}
      {isEditable && (
        <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-0.5">
          {cell.type === 'markdown' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleEditMarkdown?.();
              }}
              className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              title={cell.isEditing ? 'Render Markdown' : 'Edit Markdown'}
            >
              {cell.isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeType(cell.type === 'code' ? 'markdown' : 'code');
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Toggle Cell Type (Code / Markdown)"
          >
            {cell.type === 'code' ? (
              <>
                <Code2 className="w-3 h-3 text-blue-500" />
                <span>Code</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-emerald-500" />
                <span>MD</span>
              </>
            )}
          </button>

          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Move Cell Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Move Cell Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Delete Cell"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main cell layout */}
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Left gutter */}
        <div className="w-14 sm:w-16 shrink-0 flex flex-col items-end pt-2 select-none">
          {cell.type === 'code' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRun();
                }}
                disabled={cell.status === 'running'}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                title="Run cell (Shift+Enter)"
              >
                <Play className={`w-3.5 h-3.5 ${cell.status === 'running' ? 'animate-pulse text-amber-500' : ''}`} />
              </button>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                {cell.status === 'running' ? (
                  'In [*]:'
                ) : cell.executionCount !== null && cell.executionCount !== undefined ? (
                  `In [${cell.executionCount}]:`
                ) : (
                  'In [ ]:'
                )}
              </span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500 font-medium pt-0.5">
              MD
            </span>
          )}
        </div>

        {/* Center / Editor area */}
        <div className="flex-1 min-w-0">
          {cell.type === 'code' ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 overflow-hidden transition-colors focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-gray-900">
              <CodeMirror
                value={cell.source}
                onChange={(val) => onChangeSource(val)}
                onCreateEditor={(view) => {
                  editorViewRef.current = view;
                  if (vimMode && isEditable) {
                    ensureInsertMode(view);
                  }
                }}
                onFocus={() => {
                  onSelect();
                  if (vimMode && isEditable && editorViewRef.current) {
                    ensureInsertMode(editorViewRef.current);
                  }
                }}
                theme={theme === 'dark' ? oneDark : 'light'}
                extensions={codeExtensions}
                readOnly={!isEditable}
                editable={isEditable}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: isEditable,
                  highlightSpecialChars: true,
                  history: true,
                  foldGutter: false,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                  syntaxHighlighting: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: false,
                  rectangularSelection: true,
                  crosshairCursor: false,
                  highlightActiveLine: isEditable,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  defaultKeymap: true,
                  searchKeymap: true,
                  historyKeymap: true,
                  foldKeymap: false,
                  completionKeymap: false,
                  lintKeymap: false,
                }}
              />
            </div>
          ) : cell.isEditing && isEditable ? (
            <div className="rounded-xl border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex justify-between items-center px-3 py-1.5 text-[10px] text-gray-400 font-mono border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span>Markdown Editor</span>
                <span>Shift+Enter to render</span>
              </div>
              <CodeMirror
                value={cell.source}
                onChange={(val) => onChangeSource(val)}
                onCreateEditor={(view) => {
                  editorViewRef.current = view;
                  if (vimMode && isEditable) {
                    ensureInsertMode(view);
                  }
                }}
                onFocus={() => {
                  onSelect();
                  if (vimMode && isEditable && editorViewRef.current) {
                    ensureInsertMode(editorViewRef.current);
                  }
                }}
                theme={theme === 'dark' ? oneDark : 'light'}
                extensions={markdownExtensions}
                readOnly={!isEditable}
                editable={isEditable}
                basicSetup={{
                  lineNumbers: false,
                  highlightActiveLineGutter: false,
                  highlightSpecialChars: true,
                  history: true,
                  foldGutter: false,
                  drawSelection: true,
                  dropCursor: true,
                  indentOnInput: true,
                  syntaxHighlighting: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: false,
                  highlightActiveLine: true,
                  defaultKeymap: true,
                  historyKeymap: true,
                }}
              />
            </div>
          ) : (
            <div
              className="py-1 cursor-pointer"
              onDoubleClick={isEditable ? onToggleEditMarkdown : undefined}
            >
              <NotebookMarkdown
                content={cell.source}
                onDoubleClick={isEditable ? onToggleEditMarkdown : undefined}
              />
            </div>
          )}

          {/* Outputs area */}
          {cell.type === 'code' && cell.outputs.length > 0 && (
            <div className="mt-2.5 space-y-2 w-full">
              {cell.outputs.map((out) => {
                if (out.type === 'stdout') {
                  return (
                    <div key={out.id} className="w-full">
                      <pre className="w-full font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-100/70 dark:bg-gray-900/60 p-2.5 sm:p-3 rounded-xl whitespace-pre-wrap border border-gray-200/70 dark:border-gray-800/70 overflow-x-auto">
                        {out.text}
                      </pre>
                    </div>
                  );
                }

                if (out.type === 'stderr') {
                  return (
                    <div key={out.id} className="w-full">
                      <pre className="w-full font-mono text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2.5 sm:p-3 rounded-xl whitespace-pre-wrap border border-amber-200 dark:border-amber-800/60 overflow-x-auto">
                        {out.text}
                      </pre>
                    </div>
                  );
                }

                if (out.type === 'error') {
                  return (
                    <div key={out.id} className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/60 text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto">
                      <div className="font-bold mb-1">
                        {out.error?.name}: {out.error?.message}
                      </div>
                      {out.error?.stack && (
                        <pre className="text-[11px] text-red-600/80 dark:text-red-400/80 whitespace-pre-wrap">
                          {out.error.stack}
                        </pre>
                      )}
                    </div>
                  );
                }

                if (out.type === 'plot' && out.plot) {
                  return (
                    <div key={out.id} className="w-full">
                      <div className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold mb-1 select-none">
                        Out [{cell.executionCount ?? ' '}]:
                      </div>
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 sm:p-4">
                        <NotebookPlot data={out.plot} />
                      </div>
                    </div>
                  );
                }

                if (out.type === 'table' && out.table) {
                  return (
                    <div key={out.id} className="w-full">
                      <div className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold mb-1 select-none">
                        Out [{cell.executionCount ?? ' '}]:
                      </div>
                      <NotebookTable data={out.table} />
                    </div>
                  );
                }

                if (out.type === 'html' && out.html) {
                  return (
                    <div key={out.id} className="w-full my-2 overflow-x-auto">
                      <div
                        dangerouslySetInnerHTML={{ __html: out.html }}
                      />
                    </div>
                  );
                }

                if (out.type === 'svg' && out.svg) {
                  return (
                    <div key={out.id} className="w-full my-2 overflow-x-auto">
                      <div
                        dangerouslySetInnerHTML={{ __html: out.svg }}
                      />
                    </div>
                  );
                }

                // Default return value output
                if (out.type === 'result' && out.value !== undefined) {
                  const valStr = typeof out.value === 'object' && out.value !== null
                    ? JSON.stringify(out.value, null, 2)
                    : String(out.value);

                  return (
                    <div key={out.id} className="w-full">
                      <div className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold mb-1 select-none">
                        Out [{cell.executionCount ?? ' '}]:
                      </div>
                      <pre className="w-full font-mono text-xs text-gray-900 dark:text-gray-100 bg-gray-50/70 dark:bg-gray-900/40 p-2.5 sm:p-3 rounded-xl whitespace-pre-wrap border border-gray-200/60 dark:border-gray-800/60 overflow-x-auto">
                        {valStr}
                      </pre>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
