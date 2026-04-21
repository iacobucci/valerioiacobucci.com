import ModelViewerWrapper from '@/components/ModelViewerWrapper';

export default async function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Generic 3D Model Viewer</h1>
      
      <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
        <section>
          <h2 className="text-xl font-semibold mb-4">Microscope (GLTF with Animations)</h2>
          <ModelViewerWrapper 
            url="/3dmodels/winder.glb" 
            height="500px"
            autoRotate={true}
          />
        </section>
      </div>

      <p className="mt-8 text-gray-600 text-center">
        The viewer now supports custom URLs and plays the first available animation automatically.
      </p>
    </div>
  );
}
