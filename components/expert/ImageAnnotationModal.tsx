'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Check, Save, AlertTriangle, MousePointer2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface BBox {
  x: number
  y: number
  width: number
  height: number
}

interface ImageAnnotationModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  initialClass: string
  initialBBox: BBox
  onSave: (newClass: string, newBBox: BBox) => void
}

const snakeClasses = [
  'งูเห่า (Cobra)',
  'งูจงอาง (King Cobra)',
  'งูสามเหลี่ยม (Banded Krait)',
  'งูทับสมิงคลา (Malayan Krait)',
  'งูเขียวหางไหม้ (Green Pit Viper)',
  'งูกะปะ (Malayan Pit Viper)',
  'งูแมวเซา (Russell\'s Viper)',
  'ไม่ทราบชนิด / งูไม่มีพิษทั่วไป'
]

export default function ImageAnnotationModal({
  isOpen,
  onClose,
  imageSrc,
  initialClass,
  initialBBox,
  onSave
}: ImageAnnotationModalProps) {
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const [bbox, setBbox] = useState<BBox>(initialBBox)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'move' | 'resize-br' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startBBox = useRef<BBox>({ ...initialBBox })

  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(initialClass)
      setBbox(initialBBox)
    }
  }, [isOpen, initialClass, initialBBox])

  if (!isOpen) return null

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'resize-br') => {
    e.stopPropagation()
    setIsDragging(true)
    setDragType(type)
    startPos.current = { x: e.clientX, y: e.clientY }
    startBBox.current = { ...bbox }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    // Calculate percentage change based on container size
    const dx = ((e.clientX - startPos.current.x) / containerRect.width) * 100
    const dy = ((e.clientY - startPos.current.y) / containerRect.height) * 100

    if (dragType === 'move') {
      let newX = startBBox.current.x + dx
      let newY = startBBox.current.y + dy
      // Constrain within boundaries
      newX = Math.max(0, Math.min(newX, 100 - bbox.width))
      newY = Math.max(0, Math.min(newY, 100 - bbox.height))
      
      setBbox(prev => ({ ...prev, x: newX, y: newY }))
    } else if (dragType === 'resize-br') {
      let newW = startBBox.current.width + dx
      let newH = startBBox.current.height + dy
      // Constrain
      newW = Math.max(5, Math.min(newW, 100 - bbox.x))
      newH = Math.max(5, Math.min(newH, 100 - bbox.y))
      
      setBbox(prev => ({ ...prev, width: newW, height: newH }))
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setDragType(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-[#0A1224] border border-white/10 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Image Annotation Area */}
        <div className="flex-1 bg-black/50 relative p-4 flex flex-col min-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <MousePointer2 size={18} className="text-emerald-400" />
              แก้ไขกรอบภาพ (Bounding Box)
            </h3>
            <div className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
              ลากตรงกลางเพื่อย้าย | ลากมุมขวาล่างเพื่อปรับขนาด
            </div>
          </div>
          
          <div 
            ref={containerRef}
            className="relative flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Display Image (mock using a placeholder or actual src) */}
            <img 
              src={imageSrc} 
              alt="Snake to verify" 
              className="w-full h-full object-contain pointer-events-none"
            />
            
            {/* Interactive Bounding Box */}
            <div 
              className="absolute border-2 border-emerald-400 bg-emerald-400/20 cursor-move group transition-colors hover:border-emerald-300"
              style={{
                left: `${bbox.x}%`,
                top: `${bbox.y}%`,
                width: `${bbox.width}%`,
                height: `${bbox.height}%`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
              {/* Top-left label */}
              <div className="absolute -top-7 -left-0.5 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-t-md whitespace-nowrap">
                {selectedClass}
              </div>
              
              {/* Resize Handle (Bottom Right) */}
              <div 
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => handlePointerDown(e, 'resize-br')}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Verification Controls */}
        <div className="w-full md:w-80 bg-[#050B18] p-6 border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">ตรวจสอบข้อมูล</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* System Prediction Info */}
            <div>
              <div className="text-xs text-white/50 font-medium mb-2 uppercase tracking-wider">AI ทำนายเบื้องต้น</div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">สายพันธุ์:</span>
                  <Badge variant="warning">{initialClass}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">ความมั่นใจ:</span>
                  <span className="text-sm text-emerald-400 font-mono">87.5%</span>
                </div>
              </div>
            </div>

            {/* Expert Input */}
            <div>
              <div className="text-xs text-white/50 font-medium mb-2 uppercase tracking-wider">ยืนยันสายพันธุ์ (Expert Edit)</div>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-[#0A1224] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none transition-colors"
              >
                {snakeClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              
              {selectedClass !== initialClass && (
                <div className="mt-3 flex items-start gap-2 text-amber-400 text-xs p-2 bg-amber-400/10 rounded-lg">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>ผู้เชี่ยวชาญกำลังแก้ไขข้อมูลต่างจากที่ AI ทำนาย ระบบจะบันทึกเป็น Clean Data ชุดใหม่</span>
                </div>
              )}
            </div>
            
            {/* BBox Info */}
            <div>
              <div className="text-xs text-white/50 font-medium mb-2 uppercase tracking-wider">พิกัด Bounding Box</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/60 text-center">
                <div className="bg-white/5 py-2 rounded-lg">X: {bbox.x.toFixed(1)}%</div>
                <div className="bg-white/5 py-2 rounded-lg">Y: {bbox.y.toFixed(1)}%</div>
                <div className="bg-white/5 py-2 rounded-lg">W: {bbox.width.toFixed(1)}%</div>
                <div className="bg-white/5 py-2 rounded-lg">H: {bbox.height.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-white/10">
            <Button 
              className="w-full justify-center"
              onClick={() => {
                onSave(selectedClass, bbox)
                onClose()
              }}
            >
              <Save size={18} className="mr-2" />
              บันทึกและยืนยันภาพ
            </Button>
            <Button variant="outline" className="w-full justify-center text-white/50 border-white/10 hover:border-white/20" onClick={onClose}>
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
