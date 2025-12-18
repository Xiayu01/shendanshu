
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface PhotoItemProps {
  url: string;
  isScattered: boolean;
  index: number;
  total: number;
  isZoomed: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ url, isScattered, index, total, isZoomed }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);

  // Tree position for photos
  const treePos = useMemo(() => {
    const h = (index / total) * 8 - 4;
    const r = ((5 - h) / 10) * 4;
    const angle = (index / total) * Math.PI * 4;
    return new THREE.Vector3(
        Math.cos(angle) * r,
        h,
        Math.sin(angle) * r
    );
  }, [index, total]);

  // Scatter position
  const scatterPos = useMemo(() => new THREE.Vector3(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  ), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isZoomed) {
        // Handled by overlay mostly, but keep in scene if needed
        meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), delta * 5);
        return;
    }

    const target = isScattered ? scatterPos : treePos;
    meshRef.current.position.lerp(target, delta * 3);
    
    if (isScattered) {
        meshRef.current.lookAt(state.camera.position);
        meshRef.current.scale.lerp(new THREE.Vector3(2.5, 2.5, 1), delta * 2);
    } else {
        meshRef.current.rotation.y += delta * 0.5;
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1), delta * 2);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        transparent 
        alphaTest={0.5}
        metalness={0.2}
        roughness={0.8}
      />
      {/* Golden Frame */}
      <mesh position={[0,0,-0.01]}>
         <planeGeometry args={[1.1, 1.1]} />
         <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
    </mesh>
  );
};

export default PhotoItem;
