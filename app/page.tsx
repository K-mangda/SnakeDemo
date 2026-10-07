import type { Metadata } from 'next'
import Link from 'next/link'
import { Newsreader } from 'next/font/google'
import { ArrowDown, ArrowRight, ArrowUpRight, Database, ScanLine, ShieldCheck, SlidersHorizontal, UploadCloud } from 'lucide-react'
import ForestExperience from '@/components/home/ForestExperience'
import styles from '@/components/home/forest.module.css'
import { SNAKE_DATA } from '@/lib/data'

const displayFont = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NSTRUVision — AI-assisted snake photo analysis',
  description: 'Analyze a snake photograph, review possible species and model confidence, and explore references with NSTRUVision.',
}

const workflow = [
  { number: '01', icon: UploadCloud, title: 'Upload a photograph', text: 'Start with a clear JPEG or PNG you already have. Keep your distance; never approach a snake for a better photo.' },
  { number: '02', icon: ScanLine, title: 'Review the detection', text: 'See the region detected in the image, a possible species and the model confidence when a match is available.' },
  { number: '03', icon: ShieldCheck, title: 'Read the result carefully', text: 'Low-confidence and no-detection cases need more review. An AI result is not proof that a snake is safe.' },
]

export default function Home() {
  return (
    <ForestExperience fontClassName={displayFont.variable}>
      <section className={styles.hero} id="discover" aria-labelledby="forest-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}><span /> NSTRU VISION / AI-ASSISTED SNAKE ANALYSIS</p>
          <h1 id="forest-title">Identify a snake.<br /><em>Understand the result.</em></h1>
          <p className={styles.intro}>Upload a photo to explore a possible species match, see model confidence, and find the context behind the result.</p>
          <div className={styles.actions}>
            <Link href="/predict" className={styles.primary}><ScanLine size={17} /> Analyze a photo <ArrowUpRight size={18} /></Link>
            <a href="#guide" className={styles.textLink}>How it works <ArrowDown size={15} /></a>
          </div>
          <p className={styles.heroNote}>Observe from a distance. AI suggestions are not safety decisions.</p>
        </div>
        <div className={styles.heroFoot}>
          <a href="#guide" className={styles.scrollCue}><span className={styles.scrollLine} /> EXPLORE THE TOOL</a>
          <span className={styles.location}>01 / THE FOREST EDGE<br /><span>Inspired by the forests of southern Thailand</span></span>
        </div>
      </section>

      <div className={styles.downstream}>
        <section className={styles.guide} id="guide" aria-labelledby="guide-title">
          <div className={styles.guideInner}>
            <div className={styles.guideIntro}>
              <p className={styles.eyebrow}>IMAGE ANALYSIS / HOW IT WORKS</p>
              <h2 id="guide-title">From photograph<br />to a clearer picture.</h2>
              <p className={styles.bodyCopy}>NSTRUVision helps you examine what appears in an image. The result is a starting point for learning, with uncertainty kept visible.</p>
              <Link href="/predict" className={styles.lightLink}>Go to analysis <ArrowUpRight size={17} /></Link>
            </div>
            <div className={styles.resultPanel}>
              <div className={styles.resultPanelTop}><span className={styles.panelIcon}><SlidersHorizontal size={17} /></span><span>WHAT YOU CAN REVIEW</span><span className={styles.panelDot} /></div>
              <div className={styles.resultRows}>
                <div><span>01</span><strong>Detected region</strong><p>Locate the potential snake in your photo.</p></div>
                <div><span>02</span><strong>Species suggestion</strong><p>See a possible match when the model has one.</p></div>
                <div><span>03</span><strong>Confidence &amp; reference</strong><p>Check uncertainty and available source details.</p></div>
              </div>
              <p className={styles.panelCaution}><ShieldCheck size={15} /> Low-confidence results may need expert review.</p>
            </div>
          </div>
          <ol className={styles.steps}>
            {workflow.map(step => <li key={step.number}>
              <div className={styles.stepTop}><span>{step.number} / STEP</span><step.icon size={20} aria-hidden="true" /></div>
              <h3>{step.title}</h3><p>{step.text}</p>
            </li>)}
          </ol>
        </section>

        <section className={styles.species} id="species" aria-labelledby="species-title">
          <div className={styles.speciesInner}>
            <div className={styles.speciesIntro}>
              <p className={styles.eyebrow}>REFERENCE COLLECTION / EXPLORE</p>
              <h2 id="species-title">Know what you&apos;re looking at.</h2>
              <p className={styles.bodyCopy}>Explore example species in the reference collection. Similar-looking snakes can differ, so use these entries to learn—not to judge safety from appearance alone.</p>
              <p className={styles.caption}>REFERENCE ENTRIES ARE NOT A LIVE MODEL COVERAGE LIST</p>
            </div>
            <div className={styles.speciesList}>
              {[SNAKE_DATA[0], SNAKE_DATA[2], SNAKE_DATA[4]].map((snake, index) => (
                <details key={snake.id} className={styles.speciesItem}>
                  <summary><span className={styles.speciesIndex}>0{index + 1}</span><span><strong>{snake.name_en}</strong><i>{snake.scientific}</i></span><span className={styles.plus} aria-hidden="true">+</span></summary>
                  <div className={styles.speciesDetail}><span lang="th">{snake.name_th}</span><span>{snake.family}</span><p>This is a reference entry, not a confirmed identification of a photograph.</p><Link href="/predict">Analyze your own photo <ArrowUpRight size={14} /></Link></div>
                </details>
              ))}
              <Link href="/export" className={styles.dataLink}><Database size={17} /> Explore research exports <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      </div>
    </ForestExperience>
  )
}
