'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Center } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function MicroscopeViewer() {
  return (
    <div className="w-full h-[500px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Center>
              <Model url="/3dmodels/microscope.gltf" />
            </Center>
          </Stage>
          <OrbitControls makeDefault autoRotate />
        </Suspense>
      </Canvas>
    </div>
  );
}
