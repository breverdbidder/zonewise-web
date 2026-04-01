"use client"

import React, { useRef, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

// ── Brand palette ────────────────────────────────────────────────

const CREAM      = '#F7F2EA'
const CREAM_DARK = '#EDE7D8'
const TERRACOTTA = '#C05A33'
const NAVY       = '#1E3A5F'
const ORANGE     = '#F59E0B'
const BROWN      = '#6B3B1F'
const GLASS      = '#BAD8F7'

// ── Procedural Florida suburban house ────────────────────────────

function HouseModel() {
  return (
    <group>
      {/* Main house body */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.5, 1.8]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>

      {/* Garage wing */}
      <mesh position={[-1.65, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.0, 1.8]} />
        <meshStandardMaterial color={CREAM_DARK} roughness={0.85} />
      </mesh>

      {/* Main hip roof (4-sided pyramid) */}
      <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.75, 0.8, 4]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.9} />
      </mesh>

      {/* Garage roof */}
      <mesh position={[-1.65, 1.275, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.8, 0.55, 4]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.9} />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.7, 1.85, -0.3]} castShadow>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial color="#8B7565" roughness={0.95} />
      </mesh>

      {/* Front door */}
      <mesh position={[0.3, 0.35, 0.91]}>
        <boxGeometry args={[0.32, 0.7, 0.04]} />
        <meshStandardMaterial color={BROWN} roughness={0.9} />
      </mesh>

      {/* Door knob */}
      <mesh position={[0.17, 0.38, 0.94]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#C8A850" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Window left — glass */}
      <mesh position={[-0.6, 0.75, 0.91]}>
        <boxGeometry args={[0.4, 0.32, 0.04]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.72} roughness={0.05} metalness={0.15} />
      </mesh>
      {/* Window left — frame */}
      <mesh position={[-0.6, 0.75, 0.925]}>
        <boxGeometry args={[0.46, 0.38, 0.01]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* Window right — glass */}
      <mesh position={[0.95, 0.75, 0.91]}>
        <boxGeometry args={[0.4, 0.32, 0.04]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.72} roughness={0.05} metalness={0.15} />
      </mesh>
      {/* Window right — frame */}
      <mesh position={[0.95, 0.75, 0.925]}>
        <boxGeometry args={[0.46, 0.38, 0.01]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* Porch step */}
      <mesh position={[0.3, 0.05, 1.1]} receiveShadow>
        <boxGeometry args={[0.72, 0.1, 0.28]} />
        <meshStandardMaterial color="#D0C5AC" roughness={0.9} />
      </mesh>

      {/* Garage door panel */}
      <mesh position={[-1.65, 0.48, 0.92]}>
        <boxGeometry args={[0.76, 0.75, 0.03]} />
        <meshStandardMaterial color="#D0C5AC" roughness={0.85} />
      </mesh>
      {/* Garage door horizontal lines */}
      {[-0.18, 0.06, 0.3].map((y, i) => (
        <mesh key={i} position={[-1.65, y + 0.48, 0.935]}>
          <boxGeometry args={[0.74, 0.01, 0.01]} />
          <meshStandardMaterial color="#AAAAAA" />
        </mesh>
      ))}

      {/* FOR AUCTION yard sign */}
      <group position={[-2.4, 0, 0.6]} rotation={[0, 0.35, 0]}>
        {/* Post */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
          <meshStandardMaterial color={NAVY} roughness={0.7} />
        </mesh>
        {/* Board */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.88, 0.42, 0.06]} />
          <meshStandardMaterial color={NAVY} roughness={0.6} />
        </mesh>
        {/* Orange emissive border */}
        <mesh position={[0, 0.95, 0.032]}>
          <boxGeometry args={[0.84, 0.38, 0.01]} />
          <meshStandardMaterial
            color={ORANGE}
            roughness={0.4}
            emissive={ORANGE}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Sign text overlay */}
        <Html
          center
          position={[0, 0.95, 0.09]}
          distanceFactor={4.5}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{
            background: '#1E3A5F',
            border: '1.5px solid #F59E0B',
            borderRadius: '3px',
            padding: '3px 8px',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#F59E0B',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: 1.3,
            }}>
              FOR AUCTION
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '6px',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.5px',
            }}>
              BidDeed.AI
            </div>
          </div>
        </Html>
      </group>
    </group>
  )
}

// ── Ground plane ──────────────────────────────────────────────────

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[18, 18]} />
      <meshStandardMaterial color="#0A1628" roughness={1.0} />
    </mesh>
  )
}

// ── Scene with GSAP entrance animation ────────────────────────────

function Scene() {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const el = groupRef.current
    if (!el) return

    // Entrance: rise from below + scale in
    el.scale.set(0.01, 0.01, 0.01)
    el.position.y = -3

    gsap.to(el.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.4,
      ease: 'back.out(1.2)',
      delay: 0.25,
    })
    gsap.to(el.position, {
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.2,
    })
  }, [])

  return (
    <group ref={groupRef}>
      <HouseModel />
      <Ground />
    </group>
  )
}

// ── Canvas component (dynamically imported, no SSR) ───────────────

export default function HeroProperty3DCanvas() {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      camera={{ position: [4, 3, 6.5], fov: 44 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#020617']} />

      {/* Warm Florida sun key light */}
      <directionalLight
        color="#FFA060"
        intensity={2.8}
        position={[8, 14, 6]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Navy ambient fill */}
      <ambientLight color="#1E3A5F" intensity={0.9} />
      {/* Warm rim light from front-left */}
      <pointLight color="#F59E0B" intensity={0.6} position={[-4, 2, 4]} />

      {/* Subtle depth fog */}
      <fog attach="fog" args={['#020617', 16, 30]} />

      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.45}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.3}
        target={[0, 0.85, 0]}
      />
    </Canvas>
  )
}
