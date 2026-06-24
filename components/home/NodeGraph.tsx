'use client'
import { useEffect, useRef } from 'react'

export default function NodeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = canvas.offsetWidth
    let height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height

    let particles: Particle[] = []
    const particleCount = 80 // Number of nodes
    const connectionDistance = 150
    const mouseDistance = 200

    const mouse = { x: -1000, y: -1000 }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.8
        this.vy = (Math.random() - 0.5) * 0.8
        this.radius = Math.random() * 2 + 1
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)' // emerald-500
        ctx.fill()
      }
    }

    const init = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()

        // Connect particles to each other
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            const opacity = 1 - distance / connectionDistance
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.25})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        // Connect to mouse
        const dxMouse = particles[i].x - mouse.x
        const dyMouse = particles[i].y - mouse.y
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

        if (distanceMouse < mouseDistance) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(mouse.x, mouse.y)
          const opacity = 1 - distanceMouse / mouseDistance
          // Lines to mouse are slightly brighter
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.4})`
          ctx.lineWidth = 1
          ctx.stroke()
          
          // Slight repulsion from mouse
          if (distanceMouse < 100) {
            particles[i].x += dxMouse * 0.01
            particles[i].y += dyMouse * 0.01
          }
        }
      }
    }

    init()
    animate()

    const handleResize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
      init()
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

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.3))' }}
    />
  )
}
