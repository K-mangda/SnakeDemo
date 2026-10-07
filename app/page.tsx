import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Database, ScanLine, ShieldCheck, SlidersHorizontal, UploadCloud } from 'lucide-react'
import ForestExperience from '@/components/home/ForestExperience'
import styles from '@/components/home/forest.module.css'
import { MODEL_SPECIES } from '@/lib/model-species'

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
    <ForestExperience>
      <section className={styles.hero} id="discover" aria-labelledby="forest-title">
        <div className={styles.heroContent}>
          <h1 id="forest-title"><span>Analyze a snake photo.</span><span>Understand the result.</span></h1>
          <p className={styles.intro}>Upload a photo for a possible species match. Review the detected area, model confidence, and supporting references.</p>
          <div className={styles.actions}>
            <Link href="/predict" className={styles.primary}><ScanLine size={17} /> Start analysis <ArrowUpRight size={18} /></Link>
            <a href="#guide" className={styles.textLink}>How it works <ArrowDown size={15} /></a>
          </div>
          <p className={styles.heroNote}>AI suggestions are not safety decisions. Observe wildlife from a distance.</p>
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
              <h2 id="guide-title">See what the<br /><span className={styles.guideEmphasis}>model sees.</span></h2>
              <p className={styles.bodyCopy}>The analysis brings the detected area, a possible species match, confidence, and available references together. Uncertain results stay visible—not hidden behind a confident label.</p>
              <Link href="/predict" className={styles.lightLink}>Go to analysis <ArrowUpRight size={17} /></Link>
            </div>
            <div className={styles.resultPanel}>
              <div className={styles.resultPanelTop}><span className={styles.panelIcon}><SlidersHorizontal size={17} /></span><span>INSIDE AN ANALYSIS</span><span className={styles.panelDot} /></div>
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
              <div>
                <p className={styles.eyebrow}>MODEL CLASS INDEX / {MODEL_SPECIES.length} LABELS</p>
                <h2 id="species-title">Species in focus.</h2>
              </div>
              <div>
                <p className={styles.bodyCopy}>Explore the {MODEL_SPECIES.length} labels in the research model&apos;s training set. Predictions are suggestions, not confirmed identifications.</p>
                <p className={styles.caption}>TRAINING LABELS · THE ACTIVE DEPLOYED MODEL MAY DIFFER</p>
              </div>
            </div>
            <div className={styles.speciesListMeta}><span>01–{MODEL_SPECIES.length} / MODEL LABELS</span><span>SCROLL TO EXPLORE <ArrowDown size={14} aria-hidden="true" /></span></div>
            <div className={styles.speciesList} role="region" aria-label={`Model training class index, ${MODEL_SPECIES.length} entries`} tabIndex={0}>
              {MODEL_SPECIES.map((snake, index) => (
                <details key={snake.scientific} className={styles.speciesItem}>
                  <summary>
                    <span className={styles.speciesIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.speciesName}><strong>{snake.nameEn}</strong><i>{snake.scientific}</i></span>
                    <span className={`${styles.speciesThai} ${snake.nameTh ? '' : styles.speciesThaiMissing}`} lang={snake.nameTh ? 'th' : undefined} title={snake.nameTh ?? 'Thai common name not verified'}>{snake.nameTh ?? '—'}</span>
                    <span className={styles.speciesFamily}>{snake.family}</span>
                    <span className={styles.plus} aria-hidden="true">+</span>
                  </summary>
                  <div className={styles.speciesDetail}><p>A training label, not a confirmed identification or a safety assessment.</p><Link href="/predict">Analyze your photo <ArrowUpRight size={14} /></Link></div>
                </details>
              ))}
            </div>
            <Link href="/export" className={styles.dataLink}><Database size={23} /><span><strong>Research resources</strong><small>Explore model and dataset exports</small></span><ArrowRight size={18} /></Link>
          </div>
        </section>
      </div>
    </ForestExperience>
  )
}
