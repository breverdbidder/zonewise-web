"use client"

import React, { useRef, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

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

// ── CSS floating UI cards (BID / SKIP / price) ────────────────────

interface BadgesProps {
  show: boolean
}

function FloatingUI({ show }: BadgesProps) {
  return (
    <>
      {/* BID badge — right */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700"
        style={{
          top: '28%',
          right: '7%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateX(50px)',
          animation: show ? 'heroFloat 3s ease-in-out infinite' : 'none',
        }}
      >
        <div style={{
          background: '#16a34a',
          color: '#fff',
          borderRadius: '8px',
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 4px 20px rgba(22,163,74,0.55)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          ✓ BID
        </div>
      </div>

      {/* SKIP badge — left */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700 delay-150"
        style={{
          top: '40%',
          left: '6%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateX(-50px)',
          animation: show ? 'heroFloat 3.5s ease-in-out infinite 0.6s' : 'none',
        }}
      >
        <div style={{
          background: '#dc2626',
          color: '#fff',
          borderRadius: '8px',
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 4px 20px rgba(220,38,38,0.55)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          ✗ SKIP
        </div>
      </div>

      {/* Price card — bottom right */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700 delay-300"
        style={{
          bottom: '28%',
          right: '6%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(30px)',
          animation: show ? 'heroFloat 4s ease-in-out infinite 1.1s' : 'none',
        }}
      >
        <div style={{
          background: 'rgba(2,6,23,0.88)',
          border: '1px solid rgba(245,158,11,0.45)',
          borderRadius: '10px',
          padding: '10px 18px',
          fontFamily: 'Inter, system-ui, sans-serif',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
          boxShadow: '0 8px 28px rgba(0,0,0,0.65)',
          minWidth: '115px',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: '9px', letterSpacing: '1.5px', marginBottom: '3px', textTransform: 'uppercase' }}>
            Opening Bid
          </div>
          <div style={{ color: '#F59E0B', fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>
            $184K
          </div>
          <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>
            ↑ $42K below ARV
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main exported component ───────────────────────────────────────

interface HeroProperty3DProps {
  className?: string
  children?: React.ReactNode
}

export function HeroProperty3D({ className, children }: HeroProperty3DProps) {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [showUI, setShowUI] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    setMounted(true)

    if (!mobile) {
      // Show floating UI after entrance animation completes
      const t = setTimeout(() => setShowUI(true), 1800)

      gsap.registerPlugin(ScrollTrigger)
      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 70%',
        onEnter: () => setShowUI(true),
      })

      return () => {
        clearTimeout(t)
        trigger.kill()
      }
    }
  }, [])

  // SSR + mobile: gradient fallback with children
  if (!mounted || isMobile) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{
          background: 'radial-gradient(ellipse 110% 90% at 65% 55%, rgba(30,58,95,0.92) 0%, rgba(2,6,23,1) 65%)',
        }}
      >
        {children && <div className="relative z-10">{children}</div>}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Float keyframes */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
      `}</style>

      {/* R3F Canvas — full-bleed background */}
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

      {/* Radial vignette — preserves text readability over 3D scene */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 10%, rgba(2,6,23,0.45) 65%, rgba(2,6,23,0.88) 100%)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(to right, #1E3A5F 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          opacity: 0.025,
          zIndex: 6,
          pointerEvents: 'none',
        }}
      />

      {/* Floating UI cards */}
      <FloatingUI show={showUI} />

      {/* Hero text content */}
      {children && (
        <div className="relative z-30">{children}</div>
      )}
    </div>
  )
}
