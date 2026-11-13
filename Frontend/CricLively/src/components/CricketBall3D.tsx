import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, Environment } from '@react-three/drei';

function CricketBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current && groupRef.current) {
      // Slow rotation
      meshRef.current.rotation.y += 0.008;
      meshRef.current.rotation.x += 0.003;
      
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow>
        {/* Main ball */}
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          color="#8B2500"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      
      {/* Seam - horizontal ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.52, 0.03, 16, 100]} />
        <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
      </mesh>
      
      {/* Seam stitches */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 1.54,
              0,
              Math.sin(angle) * 1.54,
            ]}
            rotation={[0, -angle, Math.PI / 2]}
          >
            <boxGeometry args={[0.08, 0.02, 0.02]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function CricketBall3D() {
  return (
    <div className="w-full h-[320px] sm:h-[500px] md:h-[600px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        shadows
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.8}
          color="#ffffff"
        />
        
        <CricketBall />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
