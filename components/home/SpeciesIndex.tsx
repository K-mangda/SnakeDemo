import 'server-only'

import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { MODEL_CLASS_LABELS } from '@/lib/model-species'
import styles from './forest.module.css'

type SpeciesReference = {
  scientific_name: string
  name_en: string | null
  name_th: string | null
  family: string | null
}

async function loadReferences(): Promise<{ records: SpeciesReference[]; unavailable: boolean }> {
  // The catalogue is editable in Admin, so never bake it into a build-time page.
  await connection()
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('snake_species')
      .select('scientific_name, name_en, name_th, family')
      .in('scientific_name', [...MODEL_CLASS_LABELS])

    if (error) throw error
    return { records: data ?? [], unavailable: false }
  } catch (error) {
    console.error('Could not load homepage species references.', error)
    return { records: [], unavailable: true }
  }
}

export default async function SpeciesIndex() {
  const { records, unavailable } = await loadReferences()
  const byScientificName = new Map(records.map(record => [record.scientific_name, record]))
  const missingCount = MODEL_CLASS_LABELS.length - byScientificName.size

  return (
    <>
      <div className={styles.speciesListMeta}><span>01–{MODEL_CLASS_LABELS.length} / MODEL LABELS</span><span>SCROLL TO EXPLORE <ArrowDown size={14} aria-hidden="true" /></span></div>
      {unavailable ? <p className={styles.speciesStatus} role="status">Reference details are temporarily unavailable. Model training labels are shown below.</p>
        : missingCount > 0 ? <p className={styles.speciesStatus} role="status">Reference details are pending for {missingCount} model {missingCount === 1 ? 'label' : 'labels'}.</p> : null}
      <div className={styles.speciesList} role="region" aria-label={`Model training class index, ${MODEL_CLASS_LABELS.length} entries`} tabIndex={0}>
        {MODEL_CLASS_LABELS.map((scientific, index) => {
          const reference = byScientificName.get(scientific)
          const nameEn = reference?.name_en?.trim() || scientific
          const nameTh = reference?.name_th?.trim() || null
          return (
            <details key={scientific} className={styles.speciesItem}>
              <summary>
                <span className={styles.speciesIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.speciesName}><strong>{nameEn}</strong>{nameEn !== scientific && <i>{scientific}</i>}</span>
                <span className={`${styles.speciesThai} ${nameTh ? '' : styles.speciesThaiMissing}`} lang={nameTh ? 'th' : undefined} title={nameTh ?? 'Thai common name not available in the reference catalogue'}>{nameTh ?? '—'}</span>
                <span className={styles.speciesFamily}>{reference?.family || '—'}</span>
                <span className={styles.plus} aria-hidden="true">+</span>
              </summary>
              <div className={styles.speciesDetail}><p>{reference ? 'A database reference, not a confirmed identification or a safety assessment.' : 'Database reference details are not available for this training label.'}</p><Link href="/predict">Analyze your photo <ArrowUpRight size={14} /></Link></div>
            </details>
          )
        })}
      </div>
    </>
  )
}
