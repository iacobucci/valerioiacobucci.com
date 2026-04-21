'use client';

import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Center, useAnimations } from '@react-three/drei';

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, scene);

  useEffect(() => {
    if (names.length > 0) {
      // Play the first animation by default
      actions[names[0]]?.play();
    }
  }, [actions, names]);

  return <primitive object={scene} />;
}

interface ModelViewerProps {
  url: string;
  height?: string;
  autoRotate?: boolean;
}

export default function ModelViewer({ url, height = '500px', autoRotate = true }: ModelViewerProps) {
  return (
    <div 
      className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-100"
      style={{ height }}
    >
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Center>
              <Model url={url} />
            </Center>
          </Stage>
          <OrbitControls makeDefault autoRotate={autoRotate} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload common models if needed
// useGLTF.preload('/3dmodels/microscope.gltf')
