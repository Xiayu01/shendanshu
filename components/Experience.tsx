
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { AppState, HandGesture, PhotoData } from '../types';
import PhotoItem from './PhotoItem';

interface ExperienceProps {
  appState: AppState;
  photos: PhotoData[];
  gesture: HandGesture | null;
  selectedPhotoId: string | null;
  onPhotoSelect: (id: string | null) => void;
  setAppState: (state: AppState) => void;
}

const Experience: React.FC<ExperienceProps> = ({ 
  appState, 
  photos, 
  gesture, 
  selectedPhotoId, 
  onPhotoSelect,
  setAppState 
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  // Christmas Tree Shape Parameters
  const count = 350;
  const baseRadius = 4;
  const height = 10;

  // Generate targets for the "Closed" state (Tree shape)
  const treePositions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const h = (i / count) * height;
      const radius = ((height - h) / height) * baseRadius;
      const angle = i * 0.4; // Spiral effect
      pos.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        h - height / 2,
        Math.sin(angle) * radius
      ));
    }
    return pos;
  }, [count, height, baseRadius]);

  // Scatter positions
  const scatterPositions = useMemo(() => {
    return Array.from({ length: count }).map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    ));
  }, [count]);

  const currentTargets = appState === AppState.CLOSED ? treePositions : scatterPositions;

  // Initialize particles
  useEffect(() => {
    if (!particlesRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.copy(treePositions[i]);
      dummy.scale.setScalar(0.2 + Math.random() * 0.3);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
      
      // Color: Dark Green, Metallic Gold, Red
      const color = new THREE.Color();
      const r = Math.random();
      if (r < 0.6) color.set('#1B4D3E'); // Matte Green
      else if (r < 0.85) color.set('#D4AF37'); // Gold
      else color.set('#B22222'); // Red
      particlesRef.current.setColorAt(i, color);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) particlesRef.current.instanceColor.needsUpdate = true;
  }, [treePositions, count]);

  // Main animation loop
  useFrame((state, delta) => {
    // 1. Particle Movement
    if (particlesRef.current) {
      const dummy = new THREE.Object3D();
      const mat = new THREE.Matrix4();
      for (let i = 0; i < count; i++) {
        particlesRef.current.getMatrixAt(i, mat);
        dummy.matrix.copy(mat);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        // Lerp towards target
        const target = currentTargets[i];
        dummy.position.lerp(target, delta * 2.5);
        
        // Add subtle floating if scattered
        if (appState === AppState.SCATTERED) {
            dummy.position.y += Math.sin(state.clock.elapsedTime + i) * 0.005;
            dummy.rotation.x += delta * 0.2;
        }

        dummy.updateMatrix();
        particlesRef.current.setMatrixAt(i, dummy.matrix);
      }
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Camera control via gesture
    if (gesture && !selectedPhotoId) {
      const targetX = (gesture.position.x - 0.5) * 15;
      const targetY = (0.5 - gesture.position.y) * 15 + 5;
      camera.position.lerp(new THREE.Vector3(targetX, targetY, 20), delta * 2);
      camera.lookAt(0, 0, 0);
    }

    // 3. Rotating the whole group
    if (groupRef.current && appState === AppState.CLOSED) {
      groupRef.current.rotation.y += delta * 0.5;
    } else if (groupRef.current && appState === AppState.SCATTERED) {
        groupRef.current.rotation.y += delta * 0.1;
    }
  });

  // Photo Selection Logic
  useEffect(() => {
    if (gesture?.isGrabbing && appState === AppState.SCATTERED && !selectedPhotoId) {
       // Simplistic proximity grab
       // Real picking would use Raycaster from hand position
       // Here we auto-pick the first visible one for demo purposes if none selected
       if (photos.length > 0) {
          onPhotoSelect(photos[0].id);
          setAppState(AppState.ZOOMED);
       }
    }
  }, [gesture?.isGrabbing, photos, appState, selectedPhotoId]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#D4AF37" />
      <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />

      <group ref={groupRef}>
        {/* Decorative Particles (Spheres/Cubes) */}
        <instancedMesh ref={particlesRef} args={[undefined, undefined, count]} castShadow receiveShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial metalness={0.7} roughness={0.3} />
        </instancedMesh>

        {/* Photo Cloud */}
        {photos.map((photo, index) => (
          <PhotoItem 
            key={photo.id}
            url={photo.url}
            isScattered={appState !== AppState.CLOSED}
            index={index}
            total={photos.length}
            isZoomed={selectedPhotoId === photo.id}
          />
        ))}

        {/* Top Star */}
        <mesh position={[0, height/2 + 0.5, 0]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700" 
            emissiveIntensity={4} 
            metalness={1} 
            roughness={0} 
          />
        </mesh>
      </group>

      {/* Post Processing for Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.5} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4} 
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default Experience;
