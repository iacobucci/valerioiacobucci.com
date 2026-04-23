'use client';

import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-400">Loading 3D Model...</div>
});

interface ModelViewerWrapperProps {
  url: string;
  height?: string;
  autoRotate?: boolean;
}

export default function ModelViewerWrapper(props: ModelViewerWrapperProps) {
  return <ModelViewer {...props} />;
}
