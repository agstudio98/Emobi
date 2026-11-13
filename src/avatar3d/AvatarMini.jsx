import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import AvatarModel from './AvatarModel';

/**
 * Miniatura 3D del avatar optimizada para burbujas circulares y avatares de cabecera.
 * Utiliza un lienzo WebGL autónomo encapsulado con recorte circular CSS nativo,
 * garantizando iluminación de estudio, cámara retratista y cero artefactos de recorte.
 */
export const AvatarMini = ({
  avatar3d,
  emotion = 'neutral',
  isSpeaking = false,
  acousticData = null,
  mouthOpen = 0,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full rounded-full overflow-hidden ${className}`}>
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.16, 2.65], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <hemisphereLight args={['#fff9e8', '#a49b83', 1.1]} />
        <directionalLight position={[2.5, 3.5, 4]} intensity={1.9} />
        <directionalLight position={[-3, 1.5, -2]} intensity={1.1} color="#FFE600" />
        <pointLight position={[0, 1.5, -3]} intensity={0.65} color="#FFD000" />
        <Environment resolution={96}>
          <Lightformer form="rect" intensity={2} position={[-3, 2, 3]} scale={[3, 4, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.4} position={[3, 1, 1]} scale={[2, 3, 1]} color="#fff1b8" />
        </Environment>
        <Suspense fallback={null}>
          <AvatarModel
            avatar3d={avatar3d}
            emotion={emotion}
            isSpeaking={isSpeaking}
            acousticData={acousticData}
            mouthOpen={mouthOpen}
            rotationY={0.25}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AvatarMini;
