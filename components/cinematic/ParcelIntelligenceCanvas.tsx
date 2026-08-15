"use client"

import React, { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ── Brand palette (DESIGN.md — do not deviate) ────────────────────
const VOID = '#020617'
const NAVY = '#1E3A5F'
const AMBER = '#F59E0B'
const SUCCESS = '#10B981'
const SLATE_800 = '#1E293B'

const GRID = 22
const SPACING = 1.55
const FOCUS_RADIUS = 2 // parcels within this many cells of center are the "scored" cluster

interface CellRef {
  mesh: THREE.Mesh
  isFocus: boolean
  extrudedHeight: number
}

function ParcelField({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  const cellsRef = useRef<CellRef[]>([])

  const cells = useMemo(() => {
    const arr: { x: number; z: number; isFocus: boolean; extrudedHeight: number }[] = []
    for (let x = -GRID / 2; x < GRID / 2; x++) {
      for (let z = -GRID / 2; z < GRID / 2; z++) {
        const isFocus = Math.abs(x) <= FOCUS_RADIUS && Math.abs(z) <= FOCUS_RADIUS
        arr.push({ x, z, isFocus, extrudedHeight: isFocus ? 1.5 + Math.random() * 2.5 : 0 })
      }
    }
    return arr
  }, [])

  useFrame(() => {
    const p = progressRef.current
    // Phase A (0 -> 0.45): grid visible, flat, camera-driven macro sweep (handled by ScrollTrigger on camera)
    // Phase B (0.45 -> 0.75): focus cluster extrudes into massing; rest fades
    // Phase C (0.75 -> 1.0): everything fades toward the dashboard rings
    const buildT = THREE.MathUtils.clamp((p - 0.45) / 0.3, 0, 1)
    const fadeT = THREE.MathUtils.clamp((p - 0.75) / 0.25, 0, 1)

    cellsRef.current.forEach((c) => {
      const mat = c.mesh.material as THREE.MeshBasicMaterial
      if (c.isFocus) {
        const h = 0.04 + buildT * c.extrudedHeight
        c.mesh.scale.y = h
        c.mesh.position.y = h / 2
        mat.opacity = (0.55 + buildT * 0.4) * (1 - fadeT)
        mat.color.set(AMBER)
      } else {
        mat.opacity = 0.22 * (1 - buildT) * (1 - fadeT)
        mat.color.set(SLATE_800)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {cells.map((c, i) => (
        <mesh
          key={i}
          position={[c.x * SPACING, 0.02, c.z * SPACING]}
          scale={[0.82, 0.02, 0.82]}
          ref={(m) => {
            if (m) cellsRef.current[i] = { mesh: m, isFocus: c.isFocus, extrudedHeight: c.extrudedHeight }
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={c.isFocus ? AMBER : SLATE_800}
            transparent
            opacity={c.isFocus ? 0.55 : 0.22}
            wireframe
          />
        </mesh>
      ))}
    </group>
  )
}

function DashboardRings({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const dotsRef = useRef<THREE.Group>(null)

  const dots = useMemo(
    () =>
      new Array(36).fill(0).map((_, i) => ({
        angle: (i / 36) * Math.PI * 2,
        radius: 4.5 + Math.random() * 3.5,
        y: Math.random() * 3,
        color: i % 3 === 0 ? SUCCESS : AMBER,
      })),
    []
  )

  useFrame(({ clock }) => {
    const p = progressRef.current
    const t = THREE.MathUtils.clamp((p - 0.72) / 0.28, 0, 1)
    const el = clock.getElapsedTime()

    if (ring1.current && ring2.current) {
      const mat1 = ring1.current.material as THREE.MeshBasicMaterial
      const mat2 = ring2.current.material as THREE.MeshBasicMaterial
      mat1.opacity = t * 0.5
      mat2.opacity = t * 0.35
      ring1.current.rotation.z = el * 0.05
      ring2.current.rotation.z = -el * 0.035
    }
    if (dotsRef.current) {
      dotsRef.current.children.forEach((child, i) => {
        const d = dots[i]
        const a = d.angle + el * 0.12
        child.position.set(Math.cos(a) * d.radius, d.y, Math.sin(a) * d.radius)
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
        mat.opacity = t * 0.9
      })
    }
  })

  return (
    <group>
      <mesh ref={ring1} rotation={[Math.PI / 2.1, 0, 0]}>
        <torusGeometry args={[6, 0.025, 8, 64]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2.1, 0, 0]} scale={[1.55, 1.55, 1.55]}>
        <torusGeometry args={[6, 0.025, 8, 64]} />
        <meshBasicMaterial color={NAVY} transparent opacity={0} />
      </mesh>
      <group ref={dotsRef}>
        {dots.map((d, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshBasicMaterial color={d.color} transparent opacity={0} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function CameraRig({
  progressRef,
  triggerEl,
}: {
  progressRef: React.MutableRefObject<number>
  triggerEl: HTMLElement | null
}) {
  useFrame(({ camera }) => {
    const p = progressRef.current
    // Macro sweep -> zoom into cluster -> pull back for dashboard
    const camX = THREE.MathUtils.lerp(7, 1.5, THREE.MathUtils.smoothstep(p, 0, 0.55))
    const camY = THREE.MathUtils.lerp(9, 4.5, THREE.MathUtils.smoothstep(p, 0, 0.5)) +
      THREE.MathUtils.lerp(0, 4, THREE.MathUtils.smoothstep(p, 0.75, 1))
    const camZ = THREE.MathUtils.lerp(15, 7, THREE.MathUtils.smoothstep(p, 0, 0.55)) +
      THREE.MathUtils.lerp(0, 7, THREE.MathUtils.smoothstep(p, 0.75, 1))
    camera.position.set(camX, camY, camZ)
    camera.lookAt(0, THREE.MathUtils.lerp(0, 1, THREE.MathUtils.smoothstep(p, 0.45, 0.7)), 0)
  })
  return null
}

interface SceneProps {
  scrollTriggerEl: HTMLElement | null
}

function Scene({ scrollTriggerEl }: SceneProps) {
  const progressRef = useRef(0)

  useEffect(() => {
    if (!scrollTriggerEl || typeof window === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    const st = ScrollTrigger.create({
      trigger: scrollTriggerEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress
      },
    })

    return () => st.kill()
  }, [scrollTriggerEl])

  return (
    <>
      <ParcelField progressRef={progressRef} />
      <DashboardRings progressRef={progressRef} />
      <CameraRig progressRef={progressRef} triggerEl={scrollTriggerEl} />
      <fog attach="fog" args={[VOID, 14, 34]} />
    </>
  )
}

export default function ParcelIntelligenceCanvas({
  scrollTriggerEl,
}: {
  scrollTriggerEl: HTMLElement | null
}) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      camera={{ position: [7, 9, 15], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={[VOID]} />
      <Suspense fallback={null}>
        <Scene scrollTriggerEl={scrollTriggerEl} />
      </Suspense>
    </Canvas>
  )
}
