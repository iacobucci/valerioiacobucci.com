'use client';

import { Vim } from '@replit/codemirror-vim';

let exCommandsRegistered = false;

/**
 * Register custom Vim Ex commands like :w (write/save) and :r (run)
 */
export function registerNotebookVimCommands() {
  if (typeof window === 'undefined' || exCommandsRegistered) return;

  try {
    // Custom :w / :write command to save external notebook or editor file
    Vim.defineEx('write', 'w', (cm: unknown) => {
      const cmAny = cm as {
        cm6?: { dom?: HTMLElement };
        openNotification?: (el: HTMLElement, opts: { bottom: boolean; duration: number }) => void;
      };
      const editorDom = cmAny?.cm6?.dom;
      let isInsideNotebook = false;
      if (editorDom) {
        isInsideNotebook = !!editorDom.closest('[data-notebook-root]');
      } else if (typeof document !== 'undefined' && document.activeElement) {
        isInsideNotebook = !!document.activeElement.closest('[data-notebook-root]');
      }

      if (isInsideNotebook) {
        window.dispatchEvent(new CustomEvent('notebook-save', { detail: { dom: editorDom } }));
      } else {
        window.dispatchEvent(new CustomEvent('editor-save', { detail: { dom: editorDom } }));
      }

      if (cmAny?.openNotification) {
        const el = document.createElement('div');
        el.textContent = isInsideNotebook ? 'Notebook saved!' : 'Saved!';
        el.style.color = '#10b981';
        el.style.fontWeight = '600';
        cmAny.openNotification(el, { bottom: true, duration: 2000 });
      }
    });

    // Custom :r / :run command to execute currently selected cell
    Vim.defineEx('run', 'r', () => {
      window.dispatchEvent(new CustomEvent('notebook-run-selected'));
    });

    exCommandsRegistered = true;
  } catch (err) {
    console.error('Failed to register Vim Ex commands', err);
  }
}
