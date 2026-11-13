import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { normalizeAvatar3D } from './config';

/**
 * Helper seguro para conversión de colores hex.
 */
const toColor = (hex, fallback = '#ffffff') => {
  try {
    return new THREE.Color(hex || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
};

// Micro variaciones de color y relieve para que la piel responda a la luz como
// una superficie orgánica, en vez de un material plano. La textura se genera
// localmente: no requiere descargas ni servicios externos.
const createSkinMaps = (color) => {
  if (typeof document === 'undefined') return {};
  const size = 1024;
  const albedoCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  albedoCanvas.width = albedoCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const albedoContext = albedoCanvas.getContext('2d');
  const bumpContext = bumpCanvas.getContext('2d');
  const base = toColor(color);
  const baseHex = `#${base.getHexString()}`;
  albedoContext.fillStyle = baseHex;
  albedoContext.fillRect(0, 0, size, size);

  const blush = albedoContext.createLinearGradient(0, 220, size, 850);
  blush.addColorStop(0, 'rgba(190, 95, 75, 0.09)');
  blush.addColorStop(0.48, 'rgba(255, 225, 205, 0)');
  blush.addColorStop(1, 'rgba(120, 64, 48, 0.08)');
  albedoContext.fillStyle = blush;
  albedoContext.fillRect(0, 0, size, size);

  // Seed fijo para evitar que el rostro cambie de aspecto en cada render.
  let seed = 173;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 18000; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 0.25 + random() * 1.15;
    const shade = random() > 0.5 ? '255, 238, 221' : '83, 45, 34';
    albedoContext.fillStyle = `rgba(${shade}, ${0.025 + random() * 0.055})`;
    albedoContext.beginPath();
    albedoContext.arc(x, y, radius, 0, Math.PI * 2);
    albedoContext.fill();
  }

  bumpContext.fillStyle = '#808080';
  bumpContext.fillRect(0, 0, size, size);
  for (let i = 0; i < 24000; i += 1) {
    const shade = Math.floor(104 + random() * 48);
    bumpContext.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.12 + random() * 0.22})`;
    bumpContext.fillRect(random() * size, random() * size, 1 + random(), 1 + random());
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  bumpMap.anisotropy = 8;
  return { map, bumpMap };
};

/**
 * Rostro orgánico de malla densa, con facciones principales integradas.
 */
const Head = ({ params, headTilt, eyeTargetRef, headSpeechRef }) => {
  const meshRef = useRef(null);
  const skinMaps = useMemo(() => createSkinMaps(params.skinTone), [params.skinTone]);
  useEffect(() => () => {
    skinMaps.map?.dispose();
    skinMaps.bumpMap?.dispose();
  }, [skinMaps]);

  // Rostro esculpido en una malla continua de alta densidad. Las facciones
  // principales deforman la superficie y no se apilan como primitivas.
  const headGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 192, 128);
    const positions = geometry.attributes.position;
    const faceRoundness = 0.94 + params.faceShape * 0.12;
    const noseScale = 0.72 + params.noseSize * 0.56;
    const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));

    for (let i = 0; i < positions.count; i += 1) {
      const nx = positions.getX(i);
      const ny = positions.getY(i);
      const nz = positions.getZ(i);
      const jawNarrowing = 1 - (1 - params.jawWidth) * 0.16 * Math.max(0, -ny);
      let x = nx * 0.48 * faceRoundness * jawNarrowing;
      const y = ny * (0.57 + (1 - params.faceShape) * 0.045);
      let z = nz * 0.49;
      const front = Math.max(0, nz) ** 2;

      // Puente y punta nasal, arco superciliar y pómulos integrados a la cara.
      const bridge = gaussian(x, y, 0, -0.055, 0.055, 0.19) * 0.075;
      const tip = gaussian(x, y, 0, -0.19, 0.082 * noseScale, 0.075) * 0.09 * noseScale;
      const brow = gaussian(x, y, 0, 0.17, 0.29, 0.075) * 0.022;
      const cheeks = (gaussian(x, y, -0.27, -0.105, 0.13, 0.105) + gaussian(x, y, 0.27, -0.105, 0.13, 0.105)) * 0.022;
      const chin = gaussian(x, y, 0, -0.39, 0.2 + params.jawWidth * 0.035, 0.095) * 0.018;
      const earRoot = gaussian(Math.abs(x), y, 0.47, 0.015, 0.065, 0.16) * 0.045;
      x += Math.sign(x) * earRoot;
      z += front * (bridge + tip + brow + cheeks + chin);
      positions.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [params.faceShape, params.jawWidth, params.noseSize]);

  // Seguimiento suave de mirada, inclinación de cabeza y cadencia de habla
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const nod = headSpeechRef?.current?.nod || 0;
    const tilt = headSpeechRef?.current?.tilt || 0;
    mesh.rotation.z += (headTilt + tilt - mesh.rotation.z) * 0.08;
    const e = eyeTargetRef.current;
    mesh.rotation.y += (e.x * 0.1 - mesh.rotation.y) * 0.06;
    mesh.rotation.x += (e.y * 0.05 + nod - mesh.rotation.x) * 0.06;
  });

  return (
    <group ref={meshRef}>
      {/* Rostro de contorno humano: mandíbula estrecha y pómulos amplios */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <primitive object={headGeometry} attach="geometry" />
        <meshPhysicalMaterial
          color="#ffffff"
          map={skinMaps.map}
          bumpMap={skinMaps.bumpMap}
          bumpScale={0.006}
          roughness={0.72}
          metalness={0}
          envMapIntensity={0.65}
          clearcoat={0.08}
          clearcoatRoughness={0.7}
        />
      </mesh>

    </group>
  );
};

/**
 * Ojos expresivos con pupila, destello de luz (catchlight) y parpadeo natural.
 */
const Eyes = ({ params, blinkRef, expression }) => {
  const leftLidRef = useRef(null);
  const rightLidRef = useRef(null);
  const pupilsRef = useRef(null);

  const eyeRadius = 0.065 + params.eyeSize * 0.035;
  const eyeColor = toColor(params.eyeColor, '#4A3728');
  const eyeX = 0.18 + params.eyeSize * 0.025;
  const browColor = toColor(params.hairColor, '#2B2118');
  const browCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-eyeRadius, 0, 0),
    new THREE.Vector3(-eyeRadius * 0.35, 0.035, 0),
    new THREE.Vector3(eyeRadius * 0.35, 0.035, 0),
    new THREE.Vector3(eyeRadius, 0, 0),
  ]), [eyeRadius]);

  // Animación del parpadeo: el párpado desciende al parpadear (blink = 1)
  useFrame(() => {
    const blink = blinkRef.current; // 0 = abierto, 1 = cerrado
    const lidScaleY = Math.max(0.01, blink);
    if (leftLidRef.current) leftLidRef.current.scale.y = lidScaleY;
    if (rightLidRef.current) rightLidRef.current.scale.y = lidScaleY;
  });

  // Ángulo de cejas según emoción
  const browRotationZ = expression === 'sonriendo' ? 0.06 : expression === 'pensativo' ? 0.14 : expression === 'sorprendido' ? -0.12 : 0;
  const browOffsetY = expression === 'sorprendido' ? 0.03 : expression === 'pensativo' ? 0.01 : 0;

  const Eye = ({ side }) => (
    <group position={[side * eyeX, 0.08, 0.44]}>
      {/* Fondo blanco esclerótica */}
      <mesh scale={[1.1, 1, 0.6]}>
        <sphereGeometry args={[eyeRadius, 48, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
      </mesh>

      {/* Iris con color vibrante */}
      <mesh position={[0, 0, eyeRadius * 0.48]} scale={[1, 1, 0.3]}>
        <sphereGeometry args={[eyeRadius * 0.62, 40, 28]} />
        <meshStandardMaterial color={eyeColor} roughness={0.35} />
      </mesh>

      {/* Pupila oscura profunda */}
      <mesh position={[0, 0, eyeRadius * 0.58]} scale={[1, 1, 0.2]}>
        <sphereGeometry args={[eyeRadius * 0.32, 16, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.2} />
      </mesh>

      {/* Destello de luz especular (Catchlight) que da vida a la mirada */}
      <mesh position={[side * 0.012 + 0.012, 0.014, eyeRadius * 0.62]} scale={[0.012, 0.012, 0.006]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Párpado superior estilizado que cubre el ojo al parpadear */}
      <mesh
        ref={side < 0 ? leftLidRef : rightLidRef}
        position={[0, eyeRadius * 0.85, eyeRadius * 0.2]}
        scale={[1.15, 0.01, 0.9]}
      >
        <sphereGeometry args={[eyeRadius * 1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={toColor(params.skinTone)} roughness={0.65} />
      </mesh>

      {/* Ceja estilizada y expresiva */}
      <group
        position={[0, eyeRadius * 1.7 + browOffsetY, 0.04]}
        rotation={[0, 0, side * -browRotationZ - side * 0.05]}
        scale={[1 + params.browThickness * 0.3, 1, 1]}
      >
        <mesh>
          <tubeGeometry args={[browCurve, 24, 0.006 + params.browThickness * 0.009, 8, false]} />
          <meshStandardMaterial color={browColor} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group ref={pupilsRef}>
      <Eye side={-1} />
      <Eye side={1} />
    </group>
  );
};

/**
 * Boca con sincronización labial (Lip-Sync), cavidad bucal, dientes y expresiones dinámicas.
 */
const Mouth = ({ params, mouthOpenRef, mouthWidthRef, expression, isSpeaking }) => {
  const mouthGroupRef = useRef(null);
  const lowerLipRef = useRef(null);
  const upperLipRef = useRef(null);
  const cavityRef = useRef(null);
  const teethRef = useRef(null);
  const lowerTeethRef = useRef(null);
  const tongueRef = useRef(null);

  const baseLipColor = toColor(params.skinTone, '#E8B48C').clone().multiplyScalar(0.74);
  const mouthW = 0.13 + params.mouthWidth * 0.09;
  const mouthH = 0.035 + params.lipsFullness * 0.04;

  const isSmiling = expression === 'sonriendo';
  const isSurprised = expression === 'sorprendido';

  useFrame(() => {
    const open = Math.min(1, Math.max(0, mouthOpenRef.current || 0));
    const widthFactor = mouthWidthRef?.current || 1;

    // Desplazamiento reactivo de labios y apertura bucal suave
    if (lowerLipRef.current) {
      lowerLipRef.current.position.y = -mouthH * 0.35 - open * 0.075;
      lowerLipRef.current.scale.x = mouthW * widthFactor * 0.95;
    }
    if (upperLipRef.current) {
      upperLipRef.current.position.y = mouthH * 0.35 + (isSmiling ? 0.015 : 0) + open * 0.018;
      upperLipRef.current.scale.x = mouthW * widthFactor * 1.05;
    }
    if (cavityRef.current) {
      cavityRef.current.scale.set(
        Math.max(0.01, mouthW * widthFactor * 0.82),
        Math.max(0.002, open * mouthH * 1.6),
        0.05
      );
      cavityRef.current.position.y = -open * 0.025;
    }
    if (teethRef.current) {
      teethRef.current.scale.set(
        mouthW * widthFactor * 0.65,
        open > 0.15 ? 0.018 : 0.0001,
        0.02
      );
    }
    if (lowerTeethRef.current) {
      lowerTeethRef.current.scale.set(
        mouthW * widthFactor * 0.55,
        open > 0.45 ? 0.012 : 0.0001,
        0.02
      );
    }
    if (tongueRef.current) {
      tongueRef.current.scale.set(
        mouthW * widthFactor * 0.45,
        open > 0.25 ? 0.015 : 0.0001,
        0.03
      );
    }
  });

  return (
    <group ref={mouthGroupRef} position={[0, -0.23, 0.46]}>
      {/* Cavidad interior oscura anatómica */}
      <mesh ref={cavityRef} position={[0, -0.01, -0.02]} scale={[mouthW * 0.8, 0.002, 0.05]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#1E080B" />
      </mesh>

      {/* Dientes superiores visibles en habla o sonrisa abierta */}
      <mesh ref={teethRef} position={[0, mouthH * 0.2, -0.005]} scale={[mouthW * 0.65, 0.0001, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Dientes inferiores sutiles en apertura amplia */}
      <mesh ref={lowerTeethRef} position={[0, -mouthH * 0.45, -0.005]} scale={[mouthW * 0.55, 0.0001, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#E8E8E8" />
      </mesh>

      {/* Lengua interior sutil visible en vocales abiertas */}
      <mesh ref={tongueRef} position={[0, -mouthH * 0.5, -0.012]} scale={[mouthW * 0.45, 0.0001, 0.03]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#B33948" roughness={0.65} />
      </mesh>

      {/* Labio Superior estilizado */}
      <mesh
        ref={upperLipRef}
        position={[0, mouthH * 0.35, 0.01]}
        scale={[mouthW * 1.05, mouthH * 0.95, 0.03]}
        rotation={[isSmiling ? -0.12 : 0, 0, 0]}
      >
        <capsuleGeometry args={[0.55, 1, 8, 16]} />
        <meshStandardMaterial color={baseLipColor} roughness={0.5} />
      </mesh>

      {/* Labio Inferior estilizado */}
      <mesh
        ref={lowerLipRef}
        position={[0, -mouthH * 0.35, 0.01]}
        scale={[mouthW * 0.95, mouthH * 1.15, 0.03]}
        rotation={[isSmiling ? 0.08 : 0, 0, 0]}
      >
        <capsuleGeometry args={[0.55, 1, 8, 16]} />
        <meshStandardMaterial color={baseLipColor} roughness={0.5} />
      </mesh>
    </group>
  );
};

/**
 * Peinados estilizados volumétricos sin z-fighting ni artefactos.
 */
const Hair = ({ params }) => {
  const color = toColor(params.hairColor, '#2B2118');
  const { hairStyle } = params;

  if (hairStyle === 'calvo') return null;

  // Casquete principal con holgura suficiente sobre el cráneo
  const baseCap = (
    <mesh position={[0, 0.08, -0.02]} scale={[1.05, 1.05, 1.06]}>
      <sphereGeometry args={[0.53, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
      <meshPhysicalMaterial color={color} roughness={0.72} clearcoat={0.12} clearcoatRoughness={0.62} />
    </mesh>
  );

  if (hairStyle === 'largo') {
    return (
      <group>
        {baseCap}
        <HairStrands color={params.hairColor} />
        {/* Mechones frontales cayendo a ambos lados */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.42, -0.32, 0.16]}
            rotation={[0.15, 0, side * -0.12]}
            scale={[0.18, 0.65, 0.22]}
          >
            <capsuleGeometry args={[0.6, 1, 12, 16]} />
            <meshStandardMaterial color={color} roughness={0.82} />
          </mesh>
        ))}
        {/* Cabellera posterior cayendo tras los hombros */}
        <mesh position={[0, -0.4, -0.26]} scale={[0.85, 0.85, 0.45]}>
          <capsuleGeometry args={[0.5, 1, 16, 20]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
      </group>
    );
  }

  if (hairStyle === 'recogido') {
    return (
      <group>
        {baseCap}
        <HairStrands color={params.hairColor} />
        {/* Moño / Chignon estilizado superior posterior */}
        <mesh position={[0, 0.48, -0.22]} scale={[0.26, 0.24, 0.24]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
        {/* Mechón suelto sutil lateral */}
        <mesh position={[0.38, -0.15, 0.34]} rotation={[0.2, 0, -0.1]} scale={[0.04, 0.3, 0.05]}>
          <capsuleGeometry args={[0.5, 1, 8, 12]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
      </group>
    );
  }

  if (hairStyle === 'punk') {
    return (
      <group>
        {baseCap}
        <HairStrands color={params.hairColor} />
        {/* Cresta / Mohawk Neo-Cubista de picos geométricos afilados */}
        {[-0.18, -0.06, 0.06, 0.18, 0.3].map((yOffset, i) => (
          <mesh
            key={i}
            position={[0, 0.58 - Math.abs(yOffset) * 0.3, 0.18 - yOffset * 0.8]}
            rotation={[-0.4 + yOffset * 0.6, 0, 0]}
            scale={[0.09, 0.22 + (1 - Math.abs(yOffset)) * 0.12, 0.12]}
          >
            <coneGeometry args={[1, 2, 5]} />
            <meshStandardMaterial color={color} roughness={0.75} />
          </mesh>
        ))}
      </group>
    );
  }

  // 'corto' (estilo moderno con flequillo y volumen superior)
  return (
    <group>
      {baseCap}
      <HairStrands color={params.hairColor} />
      {/* Flequillo geométrico estilizado sobre la frente */}
      <mesh position={[0.05, 0.38, 0.38]} rotation={[-0.35, 0.15, -0.1]} scale={[0.38, 0.12, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.35, 0.36]} rotation={[-0.3, -0.2, 0.12]} scale={[0.22, 0.11, 0.11]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

/** Finos mechones con variación de tono siguiendo la superficie del cuero cabelludo. */
const HairStrands = ({ color }) => {
  const lines = useMemo(() => {
    const positions = [];
    const colors = [];
    const base = toColor(color, '#2B2118');
    let seed = 917;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const center = [0, 0.08, -0.02];
    const radius = [0.53 * 1.05, 0.53 * 1.05, 0.53 * 1.06];
    const strandCount = 520;
    const steps = 8;

    for (let strand = 0; strand < strandCount; strand += 1) {
      const thetaStart = 0.08 + random() * 0.78;
      const phiStart = random() * Math.PI * 2;
      const length = 0.2 + random() * 0.35;
      const tone = base.clone().offsetHSL(0, 0, (random() - 0.5) * 0.16);
      for (let step = 0; step < steps; step += 1) {
        const points = [step / steps, (step + 1) / steps];
        points.forEach((t) => {
          const theta = thetaStart + length * t;
          const phi = phiStart + 0.22 * t;
          const lift = 1.012;
          const x = center[0] + Math.sin(theta) * Math.cos(phi) * radius[0] * lift;
          const y = center[1] + Math.cos(theta) * radius[1] * lift;
          const z = center[2] + Math.sin(theta) * Math.sin(phi) * radius[2] * lift;
          positions.push(x, y, z);
          colors.push(tone.r, tone.g, tone.b);
        });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    return new THREE.LineSegments(geometry, material);
  }, [color]);

  useEffect(() => () => {
    lines.geometry.dispose();
    lines.material.dispose();
  }, [lines]);

  return <primitive object={lines} renderOrder={3} />;
};

/**
 * Accesorios: Gafas de diseño (2 cristales + puente), aretes en las orejas, barba y pecas.
 */
const Accessories = ({ params }) => {
  return (
    <group>
      {/* Gafas de diseño elegante (2 cristales, puente central y patillas a las orejas) */}
      {params.glasses && (
        <group position={[0, 0.08, 0.48]}>
          {/* Lente Izquierda */}
          <mesh position={[-0.19, 0, 0]} scale={[1, 0.9, 0.35]}>
            <torusGeometry args={[0.095, 0.012, 16, 32]} />
            <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Lente Derecha */}
          <mesh position={[0.19, 0, 0]} scale={[1, 0.9, 0.35]}>
            <torusGeometry args={[0.095, 0.012, 16, 32]} />
            <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Puente nasal central */}
          <mesh position={[0, 0.03, 0.02]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.012, 0.015]} />
            <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Patillas laterales extendidas a las orejas */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.34, 0.01, -0.2]}
              rotation={[0, side * 0.15, 0]}
            >
              <boxGeometry args={[0.01, 0.012, 0.42]} />
              <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}

      {/* Aretes dorados/amarillos colgando exactamente de los lóbulos de las orejas */}
      {params.earrings && (
        <group>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.51, -0.09, -0.02]}>
              <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.038, 0.009, 12, 24]} />
                <meshStandardMaterial color="#FFE600" metalness={0.85} roughness={0.15} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Barba / Perilla recortada estilizada */}
      {params.facialHair && (
        <mesh position={[0, -0.32, 0.36]} scale={[0.42, 0.28, 0.32]}>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshStandardMaterial color={toColor(params.hairColor)} roughness={0.88} />
        </mesh>
      )}

      {/* Pecas sutiles sobre puente y mejillas */}
      {params.freckles && (
        <group>
          {[
            [-0.14, -0.01, 0.48],
            [-0.2, -0.04, 0.45],
            [-0.1, -0.03, 0.49],
            [0.1, -0.03, 0.49],
            [0.14, -0.01, 0.48],
            [0.2, -0.04, 0.45],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} scale={[0.01, 0.01, 0.005]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#9C5D33" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

/**
 * Cuello y busto / prenda de vestir (paleta Neo-Cubista Emobi).
 */
const Body = ({ params }) => {
  const skinColor = toColor(params.skinTone, '#E8B48C');
  const outfitColor = toColor(params.outfitColor, '#FFE600');
  const accentColor = toColor(params.accentColor, '#111111');
  const torsoGeometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0.36, -0.42), new THREE.Vector2(0.44, -0.32),
    new THREE.Vector2(0.48, -0.06), new THREE.Vector2(0.57, 0.17),
    new THREE.Vector2(0.55, 0.3), new THREE.Vector2(0.36, 0.43),
    new THREE.Vector2(0.2, 0.45), new THREE.Vector2(0, 0.45),
  ], 40), []);

  return (
    <group>
      {/* Cuello proporcionado */}
      <mesh position={[0, -0.68, 0]} castShadow>
        <cylinderGeometry args={[0.155, 0.19, 0.3, 32, 1]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Cuello de la prenda / acento en contraste */}
      <mesh position={[0, -0.82, 0.02]} rotation={[0.1, 0, 0]}>
        <torusGeometry args={[0.19, 0.025, 12, 40]} />
        <meshStandardMaterial color={accentColor} roughness={0.72} />
      </mesh>

      {/* Torso / Chaqueta estilizada */}
      <mesh position={[0, -1.18, 0]} castShadow receiveShadow>
        <primitive object={torsoGeometry} attach="geometry" />
        <meshPhysicalMaterial color={outfitColor} roughness={0.68} clearcoat={0.24} clearcoatRoughness={0.5} />
      </mesh>
    </group>
  );
};

/**
 * Componente principal del Modelo 3D.
 * Gestiona el frame loop, micro-movimientos naturales, parpadeo y lip-sync.
 */
export const AvatarModel = ({
  avatar3d,
  mouthOpen = 0,
  acousticData = null,
  emotion = 'neutral',
  isSpeaking = false,
  rotationY = 0,
}) => {
  const params = useMemo(() => normalizeAvatar3D(avatar3d), [avatar3d]);
  const groupRef = useRef(null);

  // Estados de animación en refs para no provocar re-renders en React
  const blinkRef = useRef(0);
  const blinkState = useRef({ value: 0, next: 140 });
  const eyeTargetRef = useRef({ x: 0, y: 0 });
  const eyeState = useRef({ x: 0, y: 0 });
  const idleRef = useRef(0);

  // Control de habla y lip-sync dinámico
  const mouthOpenRef = useRef(0);
  const mouthWidthRef = useRef(1);
  const speechTimeRef = useRef(0);
  const headSpeechRef = useRef({ nod: 0, tilt: 0 });

  // Expresión actual
  const expression = useMemo(() => {
    if (emotion && ['sonriendo', 'pensativo', 'sorprendido', 'neutral'].includes(emotion)) {
      return emotion;
    }
    return params.expression || 'neutral';
  }, [emotion, params.expression]);

  // Inclinación de cabeza por emoción
  const headTilt = useMemo(() => {
    if (expression === 'pensativo') return 0.08;
    if (expression === 'sorprendido') return -0.04;
    if (expression === 'sonriendo') return 0.03;
    return 0;
  }, [expression]);

  // Frame Loop de animación natural
  useFrame((state, delta) => {
    const dt = delta || 0.016;
    idleRef.current += 0.025;

    // 1. Manejo del ciclo de habla y Lip-Sync acústico en tiempo real
    if (isSpeaking) {
      speechTimeRef.current += dt;
      const t = speechTimeRef.current;

      let targetOpen = 0;
      let targetWidth = 1.0;

      if (acousticData && (acousticData.rms !== undefined || acousticData.bass !== undefined)) {
        // Análisis acústico en vivo (desde audio real o ElevenLabs)
        const rms = acousticData.rms || 0;
        const bass = acousticData.bass || 0;
        const mid = acousticData.mid || 0;

        // Apertura guiada por amplitud RMS y graves (formantes vocálicos principales)
        targetOpen = Math.min(1, Math.max(0, rms * 1.7 + bass * 0.85));
        // Ancho modular: medios (vocales A, E) expanden, frecuencias graves profundizan
        targetWidth = Math.max(0.75, Math.min(1.25, 0.9 + mid * 0.6 - bass * 0.2));
      } else {
        // Procedural multi-frecuencia orgánico: modula sílabas vocálicas (A, O, E) y pausas de respiración
        const syllableWave = Math.sin(t * 14) * 0.45 + Math.sin(t * 8.2) * 0.3 + 0.25;
        const cadenceMod = Math.sin(t * 2.8) * 0.4 + 0.6;
        targetOpen = Math.max(0, Math.min(0.9, syllableWave * cadenceMod));
        targetWidth = 0.9 + Math.sin(t * 10) * 0.2;
      }

      if (mouthOpen > 0) {
        targetOpen = Math.max(targetOpen, mouthOpen);
      }

      // Suavizado lerp para articulación bucal fluida
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.38;
      mouthWidthRef.current += (targetWidth - mouthWidthRef.current) * 0.35;

      // Micro-gesticulación de cabeza al hablar (asentimientos de énfasis naturales)
      headSpeechRef.current.nod = Math.sin(t * 7) * 0.018 * mouthOpenRef.current;
      headSpeechRef.current.tilt = Math.cos(t * 3.5) * 0.012 * mouthOpenRef.current;

    } else {
      speechTimeRef.current = 0;
      const targetOpen = mouthOpen > 0 ? mouthOpen : 0;
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.25;
      mouthWidthRef.current += (1.0 - mouthWidthRef.current) * 0.25;
      headSpeechRef.current.nod *= 0.85;
      headSpeechRef.current.tilt *= 0.85;

    }

    // 2. Ciclo natural de parpadeo (abierto -> parpadeo rápido -> abierto)
    const bs = blinkState.current;
    bs.next -= 1;
    if (bs.next <= 0) {
      bs.value += 0.28;
      if (bs.value >= 1) {
        bs.value = 1;
        bs.next = Math.floor(Math.random() * 180) + 100; // Cada 2.5 - 5s
      }
    } else if (bs.value > 0) {
      bs.value = Math.max(0, bs.value - 0.22);
    }
    blinkRef.current = bs.value;

    // 3. Micro-sacadas naturales de mirada
    const es = eyeState.current;
    if (Math.random() < 0.015) {
      es.x = (Math.random() - 0.5) * 0.5;
      es.y = (Math.random() - 0.5) * 0.3;
    }
    eyeTargetRef.current = es;

    // 4. Rotación suave y micro-balanceo de respiración
    if (groupRef.current) {
      const breathY = Math.sin(idleRef.current) * 0.012;
      groupRef.current.position.y = 0.12 + breathY;
      groupRef.current.rotation.y += (rotationY - groupRef.current.rotation.y) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.12, 0]}>
      <Head
        params={params}
        headTilt={headTilt}
        eyeTargetRef={eyeTargetRef}
        headSpeechRef={headSpeechRef}
      />
      <Eyes
        params={params}
        blinkRef={blinkRef}
        expression={expression}
      />
      <Mouth
        params={params}
        mouthOpenRef={mouthOpenRef}
        mouthWidthRef={mouthWidthRef}
        expression={expression}
        isSpeaking={isSpeaking}
      />
      <Hair params={params} />
      <Accessories params={params} />
      <Body params={params} />
    </group>
  );
};

export default AvatarModel;
