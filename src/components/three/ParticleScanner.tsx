/**
 * ParticleScanner — React Three Fiber 3D Animation Component
 *
 * Renders a WebGL scene with:
 *  - Rotating icosahedron wireframe
 *  - Animated particle field
 *  - Emerald-green bloom glow effect
 *  - Pulsing core sphere
 *
 * Used as a loading mask during WASM model inference.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Particle Field ────────────────────────────────────────────────────────────
export function ParticleField({ count = 400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Emerald hue with slight variation
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3]     = 0.05 * brightness;
      colors[i * 3 + 1] = 0.82 * brightness;
      colors[i * 3 + 2] = 0.35 * brightness;
    }

    return { positions, colors };
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08;
      ref.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}

// ── DNA Helix Ring ────────────────────────────────────────────────────────────
export function HelixRing() {
  const groupRef = useRef<THREE.Group>(null!);
  const count = 60;

  const positions = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = (i / count) * Math.PI * 4;
      return {
        x: Math.cos(t) * 1.6,
        y: (i / count) * 4 - 2,
        z: Math.sin(t) * 1.6,
        size: 0.04 + Math.random() * 0.04,
      };
    });
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[pos.size, 6, 6]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? '#34d399' : '#059669'}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Core Icosahedron ──────────────────────────────────────────────────────────
export function CoreIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.z += delta * 0.15;
      // Pulsing scale
      const pulse = 1 + Math.sin(t * 2.5) * 0.06;
      meshRef.current.scale.setScalar(pulse);
    }
    if (wireRef.current) {
      wireRef.current.rotation.x -= delta * 0.2;
      wireRef.current.rotation.y -= delta * 0.35;
    }
  });

  return (
    <group>
      {/* Solid glowing core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#052e16"
          emissive="#059669"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Outer wireframe */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial
          color="#34d399"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

// ── Orbit Ring ────────────────────────────────────────────────────────────────
export function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.012, 8, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
