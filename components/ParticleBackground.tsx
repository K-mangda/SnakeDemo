'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseX: number
  baseY: number
  size: number
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let animationFrameId: number
    
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120
    }

    const init = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      particles = []
      // Number of particles depends on screen size, keep it sparse
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000)

      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5 // 0.5 to 2.5 px
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)' // Emerald 500 with opacity
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Slowly move around
        p.x += p.vx
        p.y += p.vy
        
        // Wrap around edges
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Mouse interaction (repel)
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          
          // The closer to the mouse, the stronger the force
          const force = (mouse.radius - distance) / mouse.radius
          
          // Scatter away
          p.x -= forceDirectionX * force * 5
          p.y -= forceDirectionY * force * 5
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    const handleResize = () => {
      init()
    }

    init()
    draw()

    window.addEventListener('resize', handleResize)
    // Attach mouse event to window so it tracks globally over the page
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
