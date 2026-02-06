'use client'

import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Sphere, RoundedBox, Cylinder, Environment, PerspectiveCamera, Trail } from '@react-three/drei'
import * as THREE from 'three'

// Animated Background Particles
export function BackgroundParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 500

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50
    positions[i + 1] = (Math.random() - 0.5) * 50
    positions[i + 2] = (Math.random() - 0.5) * 50

    // Deep navy to electric blue gradient
    const t = Math.random()
    colors[i] = 0.1 + t * 0.13     // R
    colors[i + 1] = 0.12 + t * 0.39  // G
    colors[i + 2] = 0.21 + t * 0.75  // B
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} />
    </points>
  )
}

// Floating 3D Brain Icon
export function BrainSphere({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <Sphere args={[0.8, 32, 32]}>
          <MeshDistortMaterial
            color="#3b82f6"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </mesh>
    </Float>
  )
}

// Loading Animation 3D
export function LoadingAnimation3D() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime
    }
  })

  return (
    <group ref={groupRef}>
      <BrainSphere position={[0, 0, 0]} />
      <Trail width={2} length={6} color="#3b82f6" attenuation={(t) => t * t}>
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1} />
        </mesh>
      </Trail>
      <Trail width={2} length={6} color="#10b981" attenuation={(t) => t * t}>
        <mesh position={[-2, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
        </mesh>
      </Trail>
      <Trail width={2} length={6} color="#f59e0b" attenuation={(t) => t * t}>
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
      </Trail>
    </group>
  )
}

// Background 3D Scene
export function Background3DScene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <Suspense fallback={null}>
        <BackgroundParticles />
        <Environment preset="night" />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  )
}

// Loading 3D Scene
export function Loading3DScene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <Suspense fallback={null}>
        <LoadingAnimation3D />
        <Environment preset="night" />
      </Suspense>
      <OrbitControls enableZoom={false} />
    </Canvas>
  )
}
