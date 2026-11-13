'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Center, useAnimations } from '@react-three/drei';
import { useTheme } from '@/hooks/useTheme';
import { Box, AlertCircle } from 'lucide-react';

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

class ModelErrorBoundary extends React.Component<
  { fallback: (error?: Error) => React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.warn("ModelViewer could not load 3D model:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
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

  const renderFallback = (error?: Error) => (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/40">
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-3">
        <Box className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        3D Model Unavailable
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono max-w-sm truncate">
        {url}
      </p>
    </div>
  );

  return (
    <span 
      className="w-full border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 block"
      style={{ height }}
    >
      <ModelErrorBoundary fallback={renderFallback}>
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
      </ModelErrorBoundary>
    </span>
  );
}
