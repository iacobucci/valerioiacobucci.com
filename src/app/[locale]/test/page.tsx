import MicroscopeViewerWrapper from '@/components/MicroscopeViewerWrapper';

export default async function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">3D Microscope Viewer Test</h1>
      <div className="max-w-4xl mx-auto">
        <MicroscopeViewerWrapper />
      </div>
      <p className="mt-4 text-gray-600 text-center">
        Use your mouse to rotate, zoom, and pan.
      </p>
    </div>
  );
}
