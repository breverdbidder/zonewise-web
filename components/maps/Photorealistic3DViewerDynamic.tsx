'use client'

import dynamic from 'next/dynamic'

const Photorealistic3DViewer = dynamic(
  () => import('./Photorealistic3DViewer'),
  { ssr: false }
)

export default Photorealistic3DViewer
