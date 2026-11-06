import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Procedural Animated Ocean Waves
function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);

  // High-density plane geometry for smooth wave displacement
  const { geometry, originalPositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(36, 18, 64, 32);
    const pos = geo.attributes.position.clone();
    return { geometry: geo, originalPositions: pos };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * 1.5;
    const pos = meshRef.current.geometry.attributes.position;
    const orig = originalPositions;

    for (let i = 0; i < pos.count; i++) {
      const u = orig.getX(i);
      const v = orig.getY(i);
      // Dual sine wave interference pattern for realistic ocean swell
      const wave1 = Math.sin(u * 0.45 + time * 1.2) * 0.35;
      const wave2 = Math.cos(v * 0.65 + time * 1.5) * 0.25;
      const wave3 = Math.sin((u + v) * 0.3 + time * 0.8) * 0.15;
      pos.setZ(i, wave1 + wave2 + wave3);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2.3, 0, 0]}
      position={[0, -1.8, -2]}
    >
      <meshStandardMaterial
        color="#38A3B8"
        roughness={0.15}
        metalness={0.25}
        transparent
        opacity={0.88}
        wireframe={false}
      />
    </mesh>
  );
}

// 2. Realistic Floating 3D Boat
function FloatingBoat() {
  const boatRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!boatRef.current) return;
    const time = state.clock.getElapsedTime();

    // 1. Gentle Left to Right traverse movement (-6 to +6)
    const cycle = (time * 0.4) % (Math.PI * 2);
    const posX = Math.sin(cycle) * 5.5;
    boatRef.current.position.x = posX;

    // 2. Heave: Up & Down buoyancy matching wave elevation
    const heave = Math.sin(time * 2.2 + posX * 0.5) * 0.22 - 0.7;
    boatRef.current.position.y = heave;

    // 3. Realistic Buoyancy Rocking: Roll & Pitch
    const roll = Math.sin(time * 2.0 + posX * 0.6) * 0.12;
    const pitch = Math.cos(time * 1.6) * 0.08;
    const yawDirection = Math.cos(cycle) > 0 ? 0 : Math.PI; // Face heading direction

    boatRef.current.rotation.z = roll;
    boatRef.current.rotation.x = pitch;
    boatRef.current.rotation.y = THREE.MathUtils.lerp(boatRef.current.rotation.y, yawDirection, 0.05);
  });

  return (
    <group ref={boatRef} position={[0, -0.7, 0]} scale={[0.85, 0.85, 0.85]}>
      {/* Hull - Wooden Peach Red tone */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.55, 0.95]} />
        <meshStandardMaterial color="#FF8A75" roughness={0.4} />
      </mesh>

      {/* Bow (Front wedge) */}
      <mesh position={[1.4, 0.08, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <coneGeometry args={[0.48, 0.85, 4]} />
        <meshStandardMaterial color="#FF9E79" roughness={0.4} />
      </mesh>

      {/* Stern (Back) */}
      <mesh position={[-1.25, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.85]} />
        <meshStandardMaterial color="#E06852" roughness={0.4} />
      </mesh>

      {/* Deck floor */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.2, 0.08, 0.85]} />
        <meshStandardMaterial color="#FFE0D0" roughness={0.5} />
      </mesh>

      {/* Cabin */}
      <mesh position={[-0.3, 0.65, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.7]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>

      {/* Cabin Roof */}
      <mesh position={[-0.3, 0.98, 0]}>
        <boxGeometry args={[1.15, 0.08, 0.8]} />
        <meshStandardMaterial color="#287D91" roughness={0.3} />
      </mesh>

      {/* Cabin Windows */}
      <mesh position={[-0.3, 0.68, 0.36]}>
        <boxGeometry args={[0.7, 0.25, 0.02]} />
        <meshStandardMaterial color="#8EDCE6" roughness={0.1} />
      </mesh>
      <mesh position={[-0.3, 0.68, -0.36]}>
        <boxGeometry args={[0.7, 0.25, 0.02]} />
        <meshStandardMaterial color="#8EDCE6" roughness={0.1} />
      </mesh>

      {/* Mast */}
      <mesh position={[0.55, 1.25, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.9, 8]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.6} />
      </mesh>

      {/* Main Sail (Triangular) */}
      <mesh position={[0.55, 1.35, 0.35]} rotation={[0, 0.2, 0]}>
        <coneGeometry args={[0.65, 1.3, 3]} />
        <meshStandardMaterial color="#FFF8F2" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Coral Flag at top of mast */}
      <mesh position={[0.55, 2.2, -0.15]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial color="#FF8A75" />
      </mesh>
    </group>
  );
}

// 3. Drifting Clouds
function Clouds() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((cloud, idx) => {
      cloud.position.x += 0.008 * (idx % 2 === 0 ? 1 : 0.7);
      if (cloud.position.x > 18) {
        cloud.position.x = -18;
      }
    });
  });

  const cloudConfigs = useMemo(
    () => [
      { pos: [-10, 3.8, -5], scale: 1.2 },
      { pos: [-2, 4.3, -7], scale: 1.4 },
      { pos: [6, 3.6, -4], scale: 1.0 },
      { pos: [14, 4.0, -6], scale: 1.1 }
    ],
    []
  );

  return (
    <group ref={groupRef}>
      {cloudConfigs.map((cfg, i) => (
        <group key={i} position={cfg.pos as any} scale={cfg.scale}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.9, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.88} roughness={0.8} />
          </mesh>
          <mesh position={[0.8, -0.15, 0]}>
            <sphereGeometry args={[0.7, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} roughness={0.8} />
          </mesh>
          <mesh position={[-0.75, -0.18, 0]}>
            <sphereGeometry args={[0.65, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 4. Stylized Beach Shoreline & Palm Fronds in the background
function BeachShoreline() {
  const palmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!palmRef.current) return;
    const time = state.clock.getElapsedTime();
    palmRef.current.rotation.z = Math.sin(time * 1.5) * 0.04;
  });

  return (
    <group position={[-11, -0.6, -5]}>
      {/* Sandy Dune */}
      <mesh position={[0, -0.8, 0]}>
        <sphereGeometry args={[4.5, 24, 16]} />
        <meshStandardMaterial color="#FFBFA3" roughness={0.9} />
      </mesh>

      {/* Palm Tree */}
      <group ref={palmRef} position={[1.5, 1.2, 0]}>
        {/* Curved Trunk */}
        <mesh position={[0, 1.2, 0]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.1, 0.16, 2.5, 8]} />
          <meshStandardMaterial color="#8C5335" roughness={0.8} />
        </mesh>
        {/* Palm Canopy fronds */}
        <mesh position={[-0.4, 2.4, 0]} rotation={[0.4, 0, 0.6]}>
          <coneGeometry args={[1.1, 0.2, 5]} />
          <meshStandardMaterial color="#2E8B57" roughness={0.6} />
        </mesh>
        <mesh position={[0.4, 2.4, 0]} rotation={[-0.4, 0, -0.6]}>
          <coneGeometry args={[1.0, 0.2, 5]} />
          <meshStandardMaterial color="#3CB371" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// 5. Sun with soft warm atmospheric glow
function Sun() {
  return (
    <group position={[8, 5, -8]}>
      <mesh>
        <sphereGeometry args={[1.3, 24, 24]} />
        <meshBasicMaterial color="#FFD1A4" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.7, 16, 16]} />
        <meshBasicMaterial color="#FFE5CC" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export const PeachBeachCanvas: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-peach-light/50 bg-gradient-to-b from-peach-50 via-cream to-ocean-surface transition-all duration-500 shadow-sm ${
        compact ? 'h-36' : 'h-64 sm:h-72 lg:h-80'
      }`}
    >
      <Canvas
        camera={{ position: [0, 1.8, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.9} color="#FFF5EB" />
        <directionalLight
          position={[10, 12, 6]}
          intensity={1.4}
          color="#FFE0B2"
          castShadow={false}
        />
        <pointLight position={[-8, 6, 2]} intensity={0.6} color="#8EDCE6" />

        <Sun />
        <Clouds />
        <BeachShoreline />
        <FloatingBoat />
        <Ocean />
      </Canvas>

      {/* Subtle Overlay Badge & Status */}
      <div className="absolute top-3 left-4 flex items-center gap-2 px-3 py-1 bg-white/75 backdrop-blur-md rounded-full shadow-sm border border-peach-light text-navy text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>PEACHWAVE Live Beachside Presence</span>
      </div>

      <div className="absolute bottom-2 right-4 text-[11px] font-medium text-navy-muted/70 bg-white/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
        Interactive 3D Three.js Engine
      </div>
    </div>
  );
};

export default PeachBeachCanvas;

