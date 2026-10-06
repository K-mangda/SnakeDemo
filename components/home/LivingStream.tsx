'use client'

import { useContext, useEffect, useRef } from 'react'
import { ForestMotionContext } from './ForestExperience'
import styles from './forest.module.css'

// A single texture and a tiny shader: only painted water moves, not the whole image.
// Coordinates refer to the original illustration, so the masks survive responsive crops.
const fragment = `
precision mediump float;
uniform sampler2D scene;
uniform vec2 crop;
uniform vec2 offset;
uniform float time;
varying vec2 uv;
float oval(vec2 p, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.55, 1.0, length((p-center)/radius));
}
void main() {
  vec2 p = uv * crop + offset;
  vec3 base = texture2D(scene, p).rgb;
  float light = smoothstep(0.36, 0.72, dot(base, vec3(0.3,0.59,0.11)));
  float falls = max(oval(p, vec2(.305,.428), vec2(.085,.041)),
                max(oval(p, vec2(.227,.523), vec2(.10,.038)),
                    oval(p, vec2(.832,.752), vec2(.107,.075))));
  float pools = max(oval(p, vec2(.54,.328), vec2(.35,.04)),
                max(oval(p, vec2(.70,.635), vec2(.30,.038)),
                    oval(p, vec2(.60,.88), vec2(.36,.07))));
  float stream = sin(p.y*310.0-time*6.0 + sin(p.x*130.0)*1.5);
  vec2 displacement = vec2(
    sin(p.y*245.0-time*5.0)*.0035*falls + sin(p.y*190.0+time*1.8)*.0025*pools,
    stream*.005*falls + sin(p.x*155.0-time*2.2)*.0018*pools
  ) * light;
  vec3 color = texture2D(scene, p+displacement).rgb;
  color += vec3(.035,.044,.04) * stream * falls * light;
  gl_FragColor = vec4(color, 1.0);
}`

export default function LivingStream() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const motion = useContext(ForestMotionContext)
  const controller = useRef<((enabled: boolean) => void) | null>(null)

  useEffect(() => {
    const surface = canvas.current
    if (!surface) return
    const gl = surface.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
    if (!gl) return // The CSS illustration is always available underneath.
    const program = gl.createProgram()
    const buffer = gl.createBuffer()
    const texture = gl.createTexture()
    if (!program || !buffer || !texture) return
    const shaders: WebGLShader[] = []
    let frame = 0, clock = 0, previous = 0
    let enabled = false, inView = false, loaded = false, disposed = false
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('Shader unavailable')
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed')
      gl.attachShader(program, shader)
    }
    const release = () => {
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      shaders.forEach(shader => gl.deleteShader(shader))
      gl.deleteProgram(program)
    }
    try {
      compile(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){uv=vec2((position.x+1.0)*.5,(1.0-position.y)*.5);gl_Position=vec4(position,0.,1.);}')
      compile(gl.FRAGMENT_SHADER, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed')
    } catch {
      release()
      return
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    const timeUniform = gl.getUniformLocation(program, 'time')
    const cropUniform = gl.getUniformLocation(program, 'crop')
    const offsetUniform = gl.getUniformLocation(program, 'offset')
    const artwork = new Image()
    const draw = () => {
      if (!loaded || disposed) return
      gl.uniform1f(timeUniform, clock)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    const tick = (now: number) => {
      // Cap at 30 fps, without accumulating a time jump after pause/offscreen.
      if (now - previous >= 1000 / 30) {
        clock += previous ? Math.min((now - previous) / 1000, .1) : 0
        previous = now
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      previous = 0
      if (enabled && inView && loaded && !disposed) frame = requestAnimationFrame(tick)
    }
    controller.current = value => { enabled = value; sync() }
    const resize = () => {
      if (!loaded || disposed) return
      const w = surface.clientWidth, h = surface.clientHeight
      if (!w || !h) return
      const scale = Math.max(w / artwork.width, h / artwork.height)
      const cx = w / (artwork.width * scale), cy = h / (artwork.height * scale)
      const backgroundPosition = getComputedStyle(surface.parentElement!).backgroundPosition.split(' ')
      const px = parseFloat(backgroundPosition[0]) / 100
      const py = parseFloat(backgroundPosition[1]) / 100
      const resolution = Math.min(1, 1400 / Math.max(w, h))
      surface.width = Math.round(w * resolution)
      surface.height = Math.round(h * resolution)
      gl.viewport(0, 0, surface.width, surface.height)
      gl.uniform2f(cropUniform, cx, cy)
      gl.uniform2f(offsetUniform, (1-cx)*px, (1-cy)*py)
      draw()
    }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    observer.observe(surface)
    const sizeObserver = new ResizeObserver(resize)
    sizeObserver.observe(surface)
    const loseContext = (event: Event) => {
      event.preventDefault()
      disposed = true
      cancelAnimationFrame(frame)
      surface.style.opacity = '0'
    }
    surface.addEventListener('webglcontextlost', loseContext)
    artwork.onload = () => {
      if (disposed) return
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, artwork)
      loaded = true
      resize()
      surface.style.opacity = '1'
      sync()
    }
    artwork.src = '/forest/downstream-poster.webp'
    return () => {
      disposed = true
      controller.current = null
      cancelAnimationFrame(frame)
      observer.disconnect()
      sizeObserver.disconnect()
      surface.removeEventListener('webglcontextlost', loseContext)
      artwork.onload = null
      release()
    }
  }, [])

  useEffect(() => { controller.current?.(motion) }, [motion])

  return <div className={styles.downstreamArt} aria-hidden="true"><canvas ref={canvas} className={styles.streamCanvas} /></div>
}
