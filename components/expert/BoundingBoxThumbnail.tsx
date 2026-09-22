'use client'

import { useEffect, useRef, useState } from 'react'

type Box = { x: number; y: number; width: number; height: number }

type BoundingBoxThumbnailProps = {
  imageUrl: string | null
  bbox: Box | null
  alt: string
  className: string
  aspectRatio: number
  boxClassName: string
}

function coverBoxStyle(box: Box, imageAspect: number, containerAspect: number) {
  const scaleX = imageAspect > containerAspect ? imageAspect / containerAspect : 1
  const scaleY = imageAspect < containerAspect ? containerAspect / imageAspect : 1

  return {
    left: `${box.x * scaleX - ((scaleX - 1) * 50)}%`,
    top: `${box.y * scaleY - ((scaleY - 1) * 50)}%`,
    width: `${box.width * scaleX}%`,
    height: `${box.height * scaleY}%`,
  }
}

export default function BoundingBoxThumbnail({ imageUrl, bbox, alt, className, aspectRatio, boxClassName }: BoundingBoxThumbnailProps) {
  const [imageAspect, setImageAspect] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    setImageAspect(null)
    setFailed(false)
    const image = imageRef.current
    if (image?.complete) {
      if (image.naturalWidth > 0) setImageAspect(image.naturalWidth / image.naturalHeight)
      else setFailed(true)
    }
  }, [imageUrl])
  const boxStyle = bbox && imageAspect ? coverBoxStyle(bbox, imageAspect, aspectRatio) : undefined

  return (
    <div className={className}>
      {imageUrl && !failed ? <img ref={imageRef} src={imageUrl} alt={alt} className="h-full w-full object-cover" onLoad={(event) => setImageAspect(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)} onError={() => setFailed(true)} /> : <span className="text-xs text-zinc-600">Image unavailable</span>}
      {bbox && boxStyle && <div className={boxClassName} style={boxStyle} />}
    </div>
  )
}
