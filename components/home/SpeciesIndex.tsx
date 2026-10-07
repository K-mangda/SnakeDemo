import 'server-only'

import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import styles from './forest.module.css'

type SpeciesReference = {
  scientific_name: string
  name_en: string | null
  name_th: string | null
  family: string | null
}

const PAGE_SIZE = 500

async function loadReferences(): Promise<{ records: SpeciesReference[]; unavailable: boolean }> {
  // The catalogue is editable in Admin, so never bake it into a build-time page.
  await connection()
  try {
    const records: SpeciesReference[] = []
    const admin = getSupabaseAdmin()
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await admin
        .from('snake_species')
        .select('scientific_name, name_en, name_th, family')
        .order('scientific_name')
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) throw error
      records.push(...(data ?? []))
      if (!data || data.length < PAGE_SIZE) break
    }
    return { records, unavailable: false }
  } catch (error) {
    console.error('Could not load homepage species references.', error)
    return { records: [], unavailable: true }
  }
}

export default async function SpeciesIndex() {
  const { records, unavailable } = await loadReferences()
  const count = records.length

  return (
    <>
      <div className={styles.speciesIntro}>
        <div>
          <p className={styles.eyebrow}>REFERENCE CATALOGUE{unavailable ? '' : ` / ${count} SPECIES`}</p>
          <h2 id="species-title">Species in focus.</h2>
        </div>
        <div>
          <p className={styles.bodyCopy}>Browse the species in the reference catalogue. Entries update when the catalogue changes; a listed species is not necessarily supported by the active model.</p>
          <p className={styles.caption}>REFERENCE ENTRIES · NOT A LIVE MODEL COVERAGE LIST</p>
        </div>
      </div>
      {unavailable ? <p className={styles.speciesStatus} role="status">Species references are temporarily unavailable. Please try again later.</p>
        : count === 0 ? <p className={styles.speciesStatus} role="status">No species references are available yet.</p> : <>
          <div className={styles.speciesListMeta}><span>01–{count} / REFERENCE ENTRIES</span><span>SCROLL TO EXPLORE <ArrowDown size={14} aria-hidden="true" /></span></div>
          <div className={styles.speciesList} role="region" aria-label={`Species reference catalogue, ${count} entries`} tabIndex={0}>
            {records.map((reference, index) => {
              const scientific = reference.scientific_name
              const nameEn = reference.name_en?.trim() || scientific
              const nameTh = reference.name_th?.trim() || null
              return (
                <details key={scientific} className={styles.speciesItem}>
                  <summary>
                    <span className={styles.speciesIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.speciesName}><strong>{nameEn}</strong>{nameEn !== scientific && <i>{scientific}</i>}</span>
                    <span className={`${styles.speciesThai} ${nameTh ? '' : styles.speciesThaiMissing}`} lang={nameTh ? 'th' : undefined} title={nameTh ?? 'Thai common name not available in the reference catalogue'}>{nameTh ?? '—'}</span>
                    <span className={styles.speciesFamily}>{reference.family || '—'}</span>
                    <span className={styles.plus} aria-hidden="true">+</span>
                  </summary>
                  <div className={styles.speciesDetail}><p>A reference entry, not proof of active model coverage, identification, or safety.</p><Link href="/predict">Analyze your photo <ArrowUpRight size={14} /></Link></div>
                </details>
              )
            })}
          </div>
        </>}
    </>
  )
}
