'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';
import { ToastEventDetail } from '@/lib/toast';
import GitHubLoginButton from './GitHubLoginButton';

interface ToastItem extends ToastEventDetail {
  id: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { ...detail, id }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
              pointer-events-auto relative flex flex-col gap-3 p-4 rounded-2xl shadow-2xl border
              min-w-[280px] max-w-md bg-white dark:bg-gray-900 overflow-hidden
              ${toast.type === 'success' ? 'border-green-100 dark:border-green-900/30' : 
                toast.type === 'error' ? 'border-red-100 dark:border-red-900/30' : 
                'border-blue-100 dark:border-blue-900/30'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                  toast.type === 'error' ? 'bg-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400' : 
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
              `}>
                {toast.type === 'success' && <MdCheckCircle className="w-5 h-5" />}
                {toast.type === 'error' && <MdError className="w-5 h-5" />}
                {toast.type === 'info' && <MdInfo className="w-5 h-5" />}
              </div>

              <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 pr-2">
                {toast.message}
              </p>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <MdClose className="w-4 h-4" />
              </button>
            </div>

            {toast.showLogin && (
              <div className="flex justify-end pt-1">
                <GitHubLoginButton className="w-full justify-center" />
              </div>
            )}

            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className={`
                absolute bottom-0 left-0 h-0.5 opacity-60
                ${toast.type === 'success' ? 'bg-green-500' : 
                  toast.type === 'error' ? 'bg-red-500' : 
                  'bg-blue-500'}
              `}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
