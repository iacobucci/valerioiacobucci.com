'use client';

import React from 'react';
import { ConfirmModalProps } from './types';

export default function ConfirmModal({ 
  isOpen, title, message, confirmLabel = "Confirm", 
  confirmVariant = "primary", onConfirm, onCancel 
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variants = {
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-500",
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-500",
    purple: "bg-purple-600 hover:bg-purple-700 text-white border-purple-500",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${variants[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
