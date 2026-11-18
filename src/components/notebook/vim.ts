'use client';

import { Vim } from '@replit/codemirror-vim';

let exCommandsRegistered = false;

/**
 * Register custom Vim Ex commands like :w (write/save) and :r (run)
 */
export function registerNotebookVimCommands() {
  if (typeof window === 'undefined' || exCommandsRegistered) return;

  try {
    // Custom :w / :write command to save external notebook file
    Vim.defineEx('write', 'w', (cm: unknown) => {
      window.dispatchEvent(new CustomEvent('notebook-save'));
      const cmAny = cm as { openNotification?: (el: HTMLElement, opts: { bottom: boolean; duration: number }) => void };
      if (cmAny.openNotification) {
        const el = document.createElement('div');
        el.textContent = 'Notebook saved';
        el.style.color = '#10b981';
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
