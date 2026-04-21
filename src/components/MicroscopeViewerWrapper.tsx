'use client';

import dynamic from 'next/dynamic';

const MicroscopeViewer = dynamic(() => import('@/components/MicroscopeViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">Loading 3D Model...</div>
});

export default function MicroscopeViewerWrapper() {
  return <MicroscopeViewer />;
}
