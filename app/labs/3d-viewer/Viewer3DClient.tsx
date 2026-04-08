'use client'

import Photorealistic3DViewer from '@/components/maps/Photorealistic3DViewerDynamic'

interface Viewer3DClientProps {
  parcelId: string
  lat: number
  lng: number
}

export default function Viewer3DClient({ parcelId, lat, lng }: Viewer3DClientProps) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Photorealistic3DViewer
        parcelId={parcelId}
        lat={lat}
        lng={lng}
        zoom={800}
      />
    </div>
  )
}
