import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import AvatarModel from './AvatarModel';

/**
 * Escena con luces de estudio coherentes con la paleta Neo-Cubista Emobi.
 */
const Scene = ({
  avatar3d,
  mouthOpen,
  acousticData,
  emotion,
  isSpeaking,
  rotationY,
  spin,
  interactive,
}) => {
  return (
    <>
      <color attach="background" args={['#f6f4ed']} />
      <hemisphereLight args={['#fff9e8', '#a49b83', 1.15]} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={1.25} color="#FFE600" />
      <spotLight position={[0, 4, 2]} intensity={1.1} angle={0.72} penumbra={0.8} color="#ffffff" />
      <pointLight position={[0, 1.5, -3]} intensity={0.75} color="#FFD000" />

      {/* Reflejos de estudio calculados localmente para dar volumen a piel, pelo y ropa. */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} position={[-3, 2, 3]} scale={[3, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.7} position={[3, 1, 1]} scale={[2, 3, 1]} color="#fff1b8" />
        <Lightformer form="ring" intensity={1.1} position={[0, 3, -2]} scale={3} color="#FFE600" />
      </Environment>

      <group position={[0, 0, -0.82]} rotation={[0.12, 0, -0.12]}>
        <mesh>
          <torusGeometry args={[1.18, 0.009, 12, 96]} />
          <meshBasicMaterial color="#d4a900" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.34, 0.004, 8, 96]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.72} depthWrite={false} />
        </mesh>
      </group>

      {interactive && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.7}
          minAzimuthAngle={-Math.PI / 2.5}
          maxAzimuthAngle={Math.PI / 2.5}
          dampingFactor={0.08}
          rotateSpeed={0.75}
        />
      )}

      <Suspense fallback={null}>
        <AvatarModel
          avatar3d={avatar3d}
          mouthOpen={mouthOpen}
          acousticData={acousticData}
          emotion={emotion}
          isSpeaking={isSpeaking}
          rotationY={spin ? undefined : rotationY}
        />
        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.28}
          scale={4}
          blur={3.2}
          far={2.5}
          color="#111111"
        />
      </Suspense>
    </>
  );
};

/**
 * Visor 3D reutilizable del avatar.
 *
 * Props:
 *  - avatar3d: configuración del modelo
 *  - mouthOpen: 0..1 (lip-sync explícito)
 *  - acousticData: datos FFT ({ rms, bass, mid, high }) para lip-sync físico
 *  - emotion: emoción actual ('sonriendo' | 'pensativo' | 'sorprendido' | 'neutral')
 *  - isSpeaking: activa el lip-sync y gesticulación de habla
 *  - autoRotate: giro automático (útil en el editor o preview)
 *  - interactive: permite rotar el modelo arrastrando con el dedo/ratón
 *  - className / style
 *  - cameraPosition: posición inicial de cámara
 */
export const Avatar3D = ({
  avatar3d,
  mouthOpen = 0,
  acousticData = null,
  emotion = 'neutral',
  isSpeaking = false,
  autoRotate = false,
  interactive = false,
  className = '',
  style,
  cameraPosition = [0, 0.35, 3.1],
}) => {
  const [spin, setSpin] = React.useState(0);

  React.useEffect(() => {
    if (!autoRotate) return;
    let raf;
    const loop = () => {
      setSpin(s => s + 0.006);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  const dpr = useMemo(() => [1, 1.8], []);

  return (
    <div className={className} style={style}>
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: cameraPosition, fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        frameloop="always"
      >
        <Scene
          avatar3d={avatar3d}
          mouthOpen={mouthOpen}
          acousticData={acousticData}
          emotion={emotion}
          isSpeaking={isSpeaking}
          rotationY={spin}
          spin={autoRotate}
          interactive={interactive}
        />
      </Canvas>
    </div>
  );
};

export default Avatar3D;
