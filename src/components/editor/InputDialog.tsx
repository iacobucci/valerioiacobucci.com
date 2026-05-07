'use client';

import { useState, useEffect, useRef } from 'react';
import { InputDialogProps } from './types';

export default function InputDialog({ 
  isOpen, title, defaultValue = "", placeholder = "", 
  confirmLabel = "OK", onConfirm, onCancel 
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
          <input 
            ref={inputRef}
            type="text" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(value);
              if (e.key === 'Escape') onCancel();
            }}
            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(value)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
