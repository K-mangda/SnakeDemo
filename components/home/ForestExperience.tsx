'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import styles from './forest.module.css'

type DataConnection = EventTarget & { saveData?: boolean }
const connection = () => (navigator as Navigator & { connection?: DataConnection }).connection
const getPreferences = () =>
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0) |
  (connection()?.saveData ? 2 : 0) | (document.hidden ? 4 : 0)
const serverPreferences = () => 1
function subscribePreferences(update: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  const network = connection()
  preference.addEventListener('change', update)
  document.addEventListener('visibilitychange', update)
  network?.addEventListener('change', update)
  return () => {
    preference.removeEventListener('change', update)
    document.removeEventListener('visibilitychange', update)
    network?.removeEventListener('change', update)
  }
}

// The video has its own clock: scrolling never seeks or restarts it.
export default function ForestExperience({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences, serverPreferences)
  const reduced = Boolean(preferences & 1)
  const saveData = Boolean(preferences & 2)
  const visible = !(preferences & 4)
  const [inView, setInView] = useState(true)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    if (hero.current) observer.observe(hero.current)
    return () => {
      observer.disconnect()
    }
  }, [])

  const motionAllowed = !reduced && !saveData && visible
  const loadVideo = !reduced && !saveData && !failed

  useEffect(() => {
    const player = video.current
    if (!player || !loadVideo) return
    if (motionAllowed && inView) {
      player.play().catch(() => { /* The matching poster remains visible if autoplay is denied. */ })
    } else {
      player.pause()
    }
  }, [motionAllowed, inView, loadVideo])

  return (
    <main className={styles.world} data-motion={motionAllowed ? 'on' : 'off'}>
      <a href="#forest-title" className={styles.skipLink}>Skip to content</a>
      <div className={styles.landscape} data-testid="forest-hero">
        <div ref={hero} className={styles.heroBackdrop} aria-hidden="true">
          <div className={styles.poster} />
          {loadVideo && <video ref={video} className={`${styles.heroVideo} ${ready ? styles.videoReady : ''}`} poster="/forest/forest-loop-poster.webp" muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} onPlaying={() => setReady(true)} onError={() => { setFailed(true); setReady(false) }}>
            <source src="/forest/forest-loop.mp4" type="video/mp4" onError={() => { setFailed(true); setReady(false) }} />
          </video>}
          <div className={styles.skyTone} />
          <div className={styles.heroWash} />
          <div className={styles.mist} />
        </div>
        {children}
      </div>
    </main>
  )
}
