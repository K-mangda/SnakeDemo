'use client'
import { useEffect, useRef } from 'react'

export default function ParticleAurora() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight

    // Pre-render soft glow textures for extreme performance
    const renderGlow = (color: string) => {
      const c = document.createElement('canvas')
      c.width = 100
      c.height = 100
      const cx = c.getContext('2d')
      if (cx) {
        const grad = cx.createRadialGradient(50, 50, 0, 50, 50, 50)
        grad.addColorStop(0, `rgba(${color}, 0.12)`)
        grad.addColorStop(1, `rgba(${color}, 0)`)
        cx.fillStyle = grad
        cx.fillRect(0, 0, 100, 100)
      }
      return c
    }

    const glowEmerald = renderGlow('16, 185, 129')
    const glowPurple = renderGlow('147, 51, 234')

    // Blob definitions (The underlying invisible anchors)
    const blobs = [
      { x: w * 0.3, y: h * 0.4, r: 250, vx: 0.15, vy: -0.1, img: glowEmerald }, 
      { x: w * 0.7, y: h * 0.6, r: 250, vx: -0.1, vy: 0.15, img: glowPurple } 
    ]

    const particles: any[] = []
    
    // Generate particles for each blob
    blobs.forEach(blob => {
      // 400 particles per blob creates a dense, cloudy circle
      for (let i = 0; i < 400; i++) {
        // Square random distributes them denser near the center
        const radius = blob.r * Math.random() * Math.random()
        const angle = Math.random() * Math.PI * 2
        const offsetX = Math.cos(angle) * radius
        const offsetY = Math.sin(angle) * radius
        
        particles.push({
          blob,
          offsetX,
          offsetY,
          x: blob.x + offsetX,
          y: blob.y + offsetY,
          vx: 0,
          vy: 0,
          size: Math.random() * 40 + 20, // size of the individual glow
          mass: Math.random() * 0.5 + 0.5 // affects spring stiffness
        })
      }
    })

    const mouse = { x: -1000, y: -1000 }

    const handleResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseOut = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseOut)

    let animationId: number

    const render = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'screen'

      // Move the anchor blobs
      blobs.forEach(blob => {
        blob.x += blob.vx
        blob.y += blob.vy
        // Bounce off bounds
        if (blob.x < 0 || blob.x > w) blob.vx *= -1
        if (blob.y < 0 || blob.y > h) blob.vy *= -1
      })

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Target position based on its parent blob's current position
        const targetX = p.blob.x + p.offsetX
        const targetY = p.blob.y + p.offsetY

        // Spring force pulling it back to its original shape
        const dx = targetX - p.x
        const dy = targetY - p.y
        p.vx += dx * 0.015 * p.mass // Spring stiffness
        p.vy += dy * 0.015 * p.mass

        // Mouse repulsion force (the "Shatter" effect)
        const distToMouse = Math.hypot(mouse.x - p.x, mouse.y - p.y)
        if (distToMouse < 250) {
          const force = (250 - distToMouse) / 250
          p.vx -= (mouse.x - p.x) * force * 0.05
          p.vy -= (mouse.y - p.y) * force * 0.05
        }

        // Friction (slows them down so they don't bounce forever)
        p.vx *= 0.88
        p.vy *= 0.88

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Draw the particle
        ctx.drawImage(p.blob.img, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)
      }

      animationId = requestAnimationFrame(render)
    }
    
    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseOut)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-15 blur-[60px]"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
