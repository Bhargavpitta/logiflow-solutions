import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_s, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.25;
      ref.current.rotation.x += d * 0.1;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <Icosahedron ref={ref} args={[1.6, 4]}>
        <MeshDistortMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.4}
          distort={0.45}
          speed={2}
          roughness={0.15}
          metalness={0.85}
        />
      </Icosahedron>
    </Float>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const count = 400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  useFrame((_s, d) => { if (ref.current) ref.current.rotation.y += d * 0.05; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a5b4fc" transparent opacity={0.7} />
    </points>
  );
}

export const HeroScene = () => (
  <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 5, 5]} intensity={1.5} color="#a5b4fc" />
    <pointLight position={[-5, -3, 2]} intensity={2} color="#22d3a5" />
    <Orb />
    <Particles />
    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
  </Canvas>
);
