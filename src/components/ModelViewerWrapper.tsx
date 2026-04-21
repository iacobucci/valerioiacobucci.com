'use client';

import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">Loading 3D Model...</div>
});

interface ModelViewerWrapperProps {
  url: string;
  height?: string;
  autoRotate?: boolean;
}

export default function ModelViewerWrapper(props: ModelViewerWrapperProps) {
  return <ModelViewer {...props} />;
}
