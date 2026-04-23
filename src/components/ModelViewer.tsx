'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Center, useAnimations } from '@react-three/drei';
import { useTheme } from '@/hooks/useTheme';

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
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div 
      className="w-full border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900"
      style={{ height }}
    >
      {mounted && (
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage environment={isDark ? 'night' : 'city'} intensity={isDark ? 0.5 : 0.6}>
              <Center>
                <Model url={url} />
              </Center>
            </Stage>
            <OrbitControls makeDefault autoRotate={autoRotate} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Preload common models if needed
// useGLTF.preload('/3dmodels/microscope.gltf')
