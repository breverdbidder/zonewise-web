'use client'

import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { computeEnvelope } from '@/lib/development-analysis/hbu-engine'

const SLATE = '#020617'
const ORANGE = '#F59E0B'

export interface Envelope3DProps {
  lotW: number
  lotD: number
  front: number
  side: number
  rear: number
  maxH: number
  maxCov: number
  far: number
  width: number
  height: number
  onResetView?: React.MutableRefObject<(() => void) | null>
}

export function Envelope3D({ lotW, lotD, front, side, rear, maxH, maxCov, far, width, height, onResetView }: Envelope3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 })
  const rotRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 160 })
  const idleRef = useRef(0)

  const env = useMemo(
    () => computeEnvelope(lotW, lotD, front, side, rear, maxH, maxCov, far),
    [lotW, lotD, front, side, rear, maxH, maxCov, far]
  )

  useEffect(() => {
    if (onResetView) {
      onResetView.current = () => {
        rotRef.current = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 160 }
        idleRef.current = 0
      }
    }
  }, [onResetView])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width < 10) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SLATE)
    scene.fog = new THREE.FogExp2(SLATE, 0.003)
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(50, 80, 60)
    dir.castShadow = true
    scene.add(dir)
    const blue = new THREE.DirectionalLight(0x4488ff, 0.3)
    blue.position.set(-40, 30, -50)
    scene.add(blue)

    // Lot
    const lotGeo = new THREE.PlaneGeometry(lotW, lotD)
    const lot = new THREE.Mesh(lotGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.7 }))
    lot.rotation.x = -Math.PI / 2
    lot.receiveShadow = true
    scene.add(lot)
    const lotEdges = new THREE.LineSegments(new THREE.EdgesGeometry(lotGeo), new THREE.LineBasicMaterial({ color: 0x475569 }))
    lotEdges.rotation.x = -Math.PI / 2
    scene.add(lotEdges)

    // Setback
    const sbW = lotW - side * 2
    const sbD = lotD - front - rear
    const oZ = (front - rear) / 2
    if (sbW > 0 && sbD > 0) {
      const sbLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(sbW, sbD)),
        new THREE.LineBasicMaterial({ color: 0xF59E0B })
      )
      sbLine.rotation.x = -Math.PI / 2
      sbLine.position.set(0, 0.1, oZ)
      scene.add(sbLine)
      const mkG = new THREE.SphereGeometry(0.8, 8, 8)
      const mkM = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
      [[-sbW / 2, -sbD / 2], [sbW / 2, -sbD / 2], [-sbW / 2, sbD / 2], [sbW / 2, sbD / 2]].forEach(([x, z]) => {
        const m = new THREE.Mesh(mkG, mkM)
        m.position.set(x, 0.5, z + oZ)
        scene.add(m)
      })
    }

    // Envelope
    if (env.effFP > 0 && env.floors > 0) {
      const eH = Math.min(maxH, env.floors * 10)
      const eGeo = new THREE.BoxGeometry(env.bw, eH, env.bd)
      const eMesh = new THREE.Mesh(eGeo, new THREE.MeshPhysicalMaterial({
        color: 0x1E3A5F, transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide,
      }))
      eMesh.position.set(0, eH / 2, oZ)
      eMesh.castShadow = true
      scene.add(eMesh)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(eGeo), new THREE.LineBasicMaterial({ color: 0xF59E0B }))
      edges.position.set(0, eH / 2, oZ)
      scene.add(edges)
      for (let i = 1; i < env.floors; i++) {
        const fp = new THREE.Mesh(
          new THREE.PlaneGeometry(env.bw - 0.5, env.bd - 0.5),
          new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
        )
        fp.rotation.x = -Math.PI / 2
        fp.position.set(0, i * 10, oZ)
        scene.add(fp)
      }
      const hp = new THREE.Mesh(
        new THREE.PlaneGeometry(lotW * 1.1, lotD * 1.1),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
      )
      hp.rotation.x = -Math.PI / 2
      hp.position.y = maxH
      scene.add(hp)
    }

    // North arrow
    const arrowGeo = new THREE.ConeGeometry(1.5, 5, 4)
    const arrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }))
    arrowMesh.position.set(0, 1, -lotD / 2 - 8)
    scene.add(arrowMesh)
    const arrowBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }))
    arrowBase.position.set(0, -1, -lotD / 2 - 8)
    scene.add(arrowBase)

    scene.add(new THREE.GridHelper(200, 20, 0x1e293b, 0x1e293b).translateY(-0.1))

    function updateCamera() {
      const r = rotRef.current
      camera.position.set(
        r.radius * Math.sin(r.phi) * Math.cos(r.theta),
        r.radius * Math.cos(r.phi),
        r.radius * Math.sin(r.phi) * Math.sin(r.theta)
      )
      camera.lookAt(0, maxH * 0.3, 0)
    }
    updateCamera()

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      idleRef.current++
      if (idleRef.current > 180) { rotRef.current.theta += 0.002; updateCamera() }
      renderer.render(scene, camera)
    }
    animate()

    const reset = () => { idleRef.current = 0 }
    const onDown = (e: MouseEvent) => { mouseRef.current = { isDown: true, lastX: e.clientX, lastY: e.clientY }; reset() }
    const onUp = () => { mouseRef.current.isDown = false }
    const onMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return; reset()
      rotRef.current.theta -= (e.clientX - mouseRef.current.lastX) * 0.01
      rotRef.current.phi = Math.max(0.2, Math.min(1.4, rotRef.current.phi + (e.clientY - mouseRef.current.lastY) * 0.01))
      mouseRef.current.lastX = e.clientX; mouseRef.current.lastY = e.clientY; updateCamera()
    }
    const onWheel = (e: WheelEvent) => {
      reset()
      rotRef.current.radius = Math.max(60, Math.min(400, rotRef.current.radius + e.deltaY * 0.3))
      updateCamera()
    }
    const onKey = (e: KeyboardEvent) => {
      reset()
      if (e.key === 'ArrowLeft') rotRef.current.theta += 0.1
      else if (e.key === 'ArrowRight') rotRef.current.theta -= 0.1
      else if (e.key === 'ArrowUp') rotRef.current.phi = Math.max(0.2, rotRef.current.phi - 0.1)
      else if (e.key === 'ArrowDown') rotRef.current.phi = Math.min(1.4, rotRef.current.phi + 0.1)
      else return
      updateCamera()
    }
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 1) { mouseRef.current = { isDown: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }; reset() }
    }
    const onTE = () => { mouseRef.current.isDown = false }
    const onTM = (e: TouchEvent) => {
      if (!mouseRef.current.isDown || e.touches.length !== 1) return
      e.preventDefault(); reset()
      rotRef.current.theta -= (e.touches[0].clientX - mouseRef.current.lastX) * 0.01
      rotRef.current.phi = Math.max(0.2, Math.min(1.4, rotRef.current.phi + (e.touches[0].clientY - mouseRef.current.lastY) * 0.01))
      mouseRef.current.lastX = e.touches[0].clientX; mouseRef.current.lastY = e.touches[0].clientY; updateCamera()
    }

    canvas.addEventListener('mousedown', onDown); canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp); canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('wheel', onWheel)
    canvas.addEventListener('touchstart', onTS); canvas.addEventListener('touchend', onTE)
    canvas.addEventListener('touchmove', onTM, { passive: false })
    canvas.setAttribute('tabindex', '0')
    canvas.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      scene.traverse(o => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose())
          else (mesh.material as THREE.Material).dispose()
        }
      })
      canvas.removeEventListener('mousedown', onDown); canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp); canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('keydown', onKey)
      canvas.removeEventListener('touchstart', onTS); canvas.removeEventListener('touchend', onTE)
      canvas.removeEventListener('touchmove', onTM)
    }
  }, [lotW, lotD, front, side, rear, maxH, maxCov, far, env, width, height])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`3D building envelope: ${env.floors} floors, ${env.actualGFA.toLocaleString()} sf GFA`}
      style={{ width: '100%', height, borderRadius: 12, cursor: 'grab', display: 'block', outline: 'none' }}
    />
  )
}
