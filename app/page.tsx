import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, ScanLine } from 'lucide-react'
import ForestExperience from '@/components/home/ForestExperience'
import styles from '@/components/home/forest.module.css'
import { SNAKE_DATA } from '@/lib/data'

export const metadata: Metadata = {
  title: 'NSTRUVision — Snake photo identification and field guide',
  description: 'Explore Thai snakes and identify a snake from a photograph with NSTRUVision. An image-based research tool with expert review.',
}

export default function Home() {
  const afterword = <>
    <section className={styles.closing} aria-labelledby="closing-title">
      <p className={styles.eyebrow}>A LITTLE KNOWLEDGE. A LITTLE MORE CARE.</p>
      <h2 id="closing-title">See nature differently.</h2>
      <Link href="/predict" className={styles.primaryLight}>Identify from a photo <ArrowUpRight size={18} /></Link>
      <p className={styles.disclaimer}>A research and learning tool. Image predictions are not a medical diagnosis<br className={styles.desktopBreak} /> or a guarantee that an animal is safe.</p>
    </section>
    <footer className={styles.footer}><Link href="/">NSTRU<span>Vision</span></Link><p>Computer Science Research<br />Nakhon Si Thammarat Rajabhat University</p><a href="#discover">Back to the forest ↑</a></footer>
  </>
  return (
    <ForestExperience afterword={afterword}>
      <section className={styles.hero} id="discover" aria-labelledby="forest-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}><span /> NSTRU VISION · SNAKE PHOTO IDENTIFICATION</p>
          <h1 id="forest-title">A closer look.<br /><em>A safer distance.</em></h1>
          <p className={styles.intro}>Upload a snake photo for a possible species suggestion.<br className={styles.desktopBreak} /> Explore the field guide, and keep a safe distance in the wild.</p>
          <div className={styles.actions}>
            <Link href="/predict" className={styles.primary}><ScanLine size={17} /> Identify from a photo <ArrowUpRight size={18} /></Link>
            <a href="#guide" className={styles.textLink}>Explore the field guide <ArrowDown size={15} /></a>
          </div>
          <p className={styles.heroNote}>Observe from a distance. Let wildlife stay wild.</p>
        </div>
        <div className={styles.heroFoot}>
          <a href="#guide" className={styles.scrollCue}><span className={styles.scrollLine} /> FOLLOW THE STREAM</a>
          <span className={styles.location}>01 / THE FOREST EDGE<br /><span>Inspired by the forests of southern Thailand</span></span>
        </div>
      </section>
      <div className={styles.downstream}>
        <section className={styles.guide} id="guide" aria-labelledby="guide-title">
          <div className={styles.chapterRight}>
            <p className={styles.eyebrow}>02 / OBSERVE & UNDERSTAND</p>
            <h2 id="guide-title">Curiosity.<br /><em>With care.</em></h2>
            <p className={styles.bodyCopy}>Every pattern tells a story. Start with a photograph you already have, and let image analysis help you explore a possible identification.</p>
            <ol className={styles.steps}>
              <li><span>01</span><div><h3>Bring a photograph</h3><p>Choose a clear image. Never approach or handle a snake to get a better shot.</p></div></li>
              <li><span>02</span><div><h3>Look a little closer</h3><p>Review the detected snake, suggested species and model confidence.</p></div></li>
              <li><span>03</span><div><h3>Keep the uncertainty in view</h3><p>An AI suggestion can be wrong. Use it as a starting point, not a safety decision.</p></div></li>
            </ol>
            <Link href="/predict" className={styles.lightLink}>Start with an image <ArrowUpRight size={18} /></Link>
          </div>
        </section>
        <section className={styles.species} id="species" aria-labelledby="species-title">
          <div className={styles.chapterLeft}>
            <p className={styles.eyebrow}>03 / LIFE ALONG THE STREAM</p>
            <h2 id="species-title">Part of a<br /><em>bigger world.</em></h2>
            <p className={styles.bodyCopy}>Meet a few of the species in our reference collection. Small differences matter; appearance alone does not establish whether a snake is safe.</p>
            <div className={styles.speciesList}>
              {[SNAKE_DATA[0], SNAKE_DATA[2], SNAKE_DATA[4]].map((snake, index) => (
                <details key={snake.id} className={styles.speciesItem}>
                  <summary><span className={styles.speciesIndex}>0{index + 1}</span><span><strong>{snake.name_en}</strong><i>{snake.scientific}</i></span><span className={styles.plus} aria-hidden="true">+</span></summary>
                  <div className={styles.speciesDetail}><span lang="th">{snake.name_th}</span><span>{snake.family}</span><p>Reference entry for learning. For an image-based suggestion, use the identification tool.</p><Link href="/predict">Identify from a photograph <ArrowUpRight size={14} /></Link></div>
                </details>
              ))}
            </div>
            <p className={styles.caption}>REFERENCE COLLECTION · NOT A LIVE MODEL COVERAGE LIST</p>
          </div>
        </section>
      </div>
    </ForestExperience>
  )
}
