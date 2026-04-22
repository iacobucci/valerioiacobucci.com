'use client';

export default function MicroblogSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          <div className="space-y-3 mb-6">
            <div className="h-4 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
            <div className="h-4 w-[90%] bg-gray-50 dark:bg-gray-800/50 rounded" />
            <div className="h-4 w-[40%] bg-gray-50 dark:bg-gray-800/50 rounded" />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800/50">
            <div className="h-6 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-full" />
            <div className="h-8 w-16 bg-gray-50 dark:bg-gray-800/50 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
