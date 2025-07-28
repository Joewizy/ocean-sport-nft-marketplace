'use client'

import { useState, useRef } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Save } from 'lucide-react'

interface NFTPreviewProps {
  preview: string | null
  onCroppedImage?: (croppedFile: File) => void
}

export default function NFTPreview({ preview, onCroppedImage }: NFTPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [zoom, setZoom] = useState(100) // Zoom percentage
  const [position, setPosition] = useState({ x: 0, y: 0 }) // Pan position
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  if (!preview) return null

  if (imageError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="w-full h-80 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load image</p>
        </div>
      </div>
    )
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300)) // Max 300%
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50)) // Min 50%
  }

  const handleReset = () => {
    setZoom(100)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (zoom <= 100) return // Only allow dragging when zoomed in
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isDragging || zoom <= 100) return
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSaveCrop = () => {
    if (!preview || !canvasRef.current || !imageRef.current || !onCroppedImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imageRef.current
    const containerSize = 400 // Square container size

    // Set canvas to square dimensions
    canvas.width = containerSize
    canvas.height = containerSize

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, containerSize, containerSize)

    // Calculate image dimensions and position
    const imgAspectRatio = img.naturalWidth / img.naturalHeight
    let drawWidth = containerSize
    let drawHeight = containerSize

    if (imgAspectRatio > 1) {
      // Landscape
      drawHeight = containerSize / imgAspectRatio
    } else {
      // Portrait or square
      drawWidth = containerSize * imgAspectRatio
    }

    // Apply zoom
    drawWidth *= (zoom / 100)
    drawHeight *= (zoom / 100)

    // Calculate position (center by default, then apply user positioning)
    const drawX = (containerSize - drawWidth) / 2 + (position.x / (zoom / 100))
    const drawY = (containerSize - drawHeight) / 2 + (position.y / (zoom / 100))

    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped-nft.png', { type: 'image/png' })
        onCroppedImage(croppedFile)
      }
    }, 'image/png', 0.95)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Controls */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        
        <div className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium">
          {zoom}%
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 300}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        
        <button
          onClick={handleReset}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
        
        {onCroppedImage && (zoom !== 100 || position.x !== 0 || position.y !== 0) && (
          <button
            onClick={handleSaveCrop}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Save Crop"
          >
            <Save size={16} />
          </button>
        )}
      </div>

      {/* Image Container - Fixed square like 1080x1080 */}
      <div className="relative w-full aspect-square bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <div 
          className={`absolute inset-0 ${zoom > 100 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
        >
          <img
            ref={imageRef}
            src={preview}
            alt="NFT Preview"
            className={`w-full h-full object-contain transition-all duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `scale(${zoom / 100}) translate(${position.x / (zoom / 100)}px, ${position.y / (zoom / 100)}px)`,
              transformOrigin: 'center center'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            draggable={false}
          />
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Zoom hint */}
        {zoom > 100 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            Drag to pan
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
        Adjust zoom to fit your image perfectly
        {onCroppedImage && (zoom !== 100 || position.x !== 0 || position.y !== 0) && (
          <span className="block text-green-600 dark:text-green-400 font-medium">
            Click save to apply crop
          </span>
        )}
      </div>
    </div>
  )
}