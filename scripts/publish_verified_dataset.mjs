#!/usr/bin/env node
/**
 * Build and optionally publish a verified Snake Vision dataset release.
 *
 * Only snake_images with status=verified, final_species_id, and a valid
 * final_bbox are exported. Predicted labels and boxes are never used.
 */

import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { ZipArchive } = require('archiver')

const root = resolve(import.meta.dirname, '..')
const defaultOutput = join(root, 'dataset-release')
const imageBucket = 'prediction-images'
const pageSize = 1_000

async function loadLocalEnvironmentSafely() {
  for (const name of ['.env.local', '.env']) {
    try {
      const content = await readFile(join(root, name), 'utf8')
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
        if (!match || match[2].startsWith('#')) continue
        const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
        if (!process.env[match[1]]) process.env[match[1]] = value
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

function environment(name, ...fallbacks) {
  for (const candidate of [name, ...fallbacks]) {
    if (process.env[candidate]) return candidate === 'NEXT_PUBLIC_SUPABASE_URL' ? process.env[candidate].replace(/\/$/, '') : process.env[candidate]
  }
  throw new Error(`Missing ${name}. Add it to .env.local; never commit secrets.`)
}

async function fetchRows(baseUrl, key, table, select, filters = {}) {
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`${baseUrl}/rest/v1/${table}`)
    url.searchParams.set('select', select)
    url.searchParams.set('order', 'created_at.asc')
    for (const [name, value] of Object.entries(filters)) url.searchParams.set(name, value)
    const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${offset}-${offset + pageSize - 1}`, 'Range-Unit': 'items' } })
    if (!response.ok) throw new Error(`Supabase ${table} request failed (${response.status}): ${await response.text()}`)
    const page = await response.json()
    if (!Array.isArray(page)) throw new Error(`Unexpected response from Supabase ${table}.`)
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

function finalBox(value) {
  if (!value || typeof value !== 'object') return null
  const box = Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Number(value[key])]))
  if (!Object.values(box).every(Number.isFinite)) return null
  if (box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0 || box.x + box.width > 100 || box.y + box.height > 100) return null
  return box
}

function imageFilename(image) {
  const extension = extname(image.storage_path || image.original_filename).toLowerCase()
  return `${image.id}${['.jpg', '.jpeg', '.png'].includes(extension) ? extension : '.jpg'}`
}

async function downloadImage(baseUrl, key, storagePath, destination) {
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${baseUrl}/storage/v1/object/${imageBucket}/${encodedPath}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!response.ok || !response.body) throw new Error(`Storage download failed (${response.status}): ${await response.text()}`)
  await finished(Readable.fromWeb(response.body).pipe(createWriteStream(destination)))
}

async function getImageSize(path) {
  const buffer = await readFile(path)
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('Unsupported image type')
  let cursor = 2
  while (cursor < buffer.length) {
    while (buffer[cursor] === 0xff) cursor += 1
    const marker = buffer[cursor++]
    if ([0xd8, 0xd9].includes(marker)) continue
    const length = buffer.readUInt16BE(cursor) - 2
    cursor += 2
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { height: buffer.readUInt16BE(cursor + 1), width: buffer.readUInt16BE(cursor + 3) }
    cursor += length
  }
  throw new Error('Could not read JPEG dimensions')
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function archiveFolder(source, destination) {
  const output = createWriteStream(destination)
  const archive = new ZipArchive({ zlib: { level: 6 } })
  archive.on('warning', error => { if (error.code !== 'ENOENT') throw error })
  archive.on('error', error => { throw error })
  archive.pipe(output)
  archive.directory(source, false)
  archive.finalize()
  await finished(output)
}

function parseArguments() {
  const options = { version: null, output: defaultOutput, upload: false, dryRun: false }
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index]
    if (arg === '--version') options.version = process.argv[++index]
    else if (arg === '--output') options.output = resolve(process.argv[++index])
    else if (arg === '--upload') options.upload = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--help') {
      console.log('Usage: node scripts/publish_verified_dataset.mjs --version v1 [--dry-run] [--upload] [--output folder]')
      process.exit(0)
    } else throw new Error(`Unknown option: ${arg}`)
  }
  if (!options.version || !/^v\d+(?:\.\d+){0,2}$/.test(options.version)) throw new Error('Use --version v1, v2.0, or v2.0.0.')
  return options
}

async function buildRelease(version, outputRoot, dryRun = false) {
  await loadLocalEnvironmentSafely()
  const baseUrl = environment('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = environment('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
  const [images, speciesRows] = await Promise.all([
    fetchRows(baseUrl, serviceKey, 'snake_images', 'id,storage_path,original_filename,final_species_id,final_bbox', { status: 'eq.verified' }),
    fetchRows(baseUrl, serviceKey, 'snake_species', 'id,scientific_name,name_th,name_en'),
  ])
  const speciesById = new Map(speciesRows.map(species => [species.id, species]))
  const skipped = []
  const candidates = images.flatMap(image => {
    const species = speciesById.get(image.final_species_id)
    const box = finalBox(image.final_bbox)
    if (!species) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_final_species' }); return [] }
    if (!box) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_or_invalid_final_bbox' }); return [] }
    return [{ ...image, species, box }]
  })

  if (dryRun) {
    const classes = new Set(candidates.map(image => image.species.id)).size
    console.log(`Ready to publish ${candidates.length} verified images across ${classes} classes.`)
    console.log(`Skipped ${skipped.length} verified records with incomplete final annotations.`)
    return null
  }

  const releaseRoot = join(outputRoot, version)
  await rm(releaseRoot, { recursive: true, force: true })
  const sourceImages = join(releaseRoot, 'source-images')
  await mkdir(sourceImages, { recursive: true })
  const ready = []
  console.log(`Downloading ${candidates.length} verified images…`)
  for (const [index, image] of candidates.entries()) {
    const filename = imageFilename(image)
    try {
      const destination = join(sourceImages, filename)
      await downloadImage(baseUrl, serviceKey, image.storage_path, destination)
      ready.push({ ...image, filename, ...(await getImageSize(destination)) })
    } catch (error) {
      skipped.push({ id: image.id, filename: image.original_filename, reason: `download_failed: ${error.message}` })
    }
    if ((index + 1) % 100 === 0 || index + 1 === candidates.length) console.log(`  ${index + 1}/${candidates.length}`)
  }

  const species = [...new Map(ready.map(image => [image.species.id, image.species])).values()].sort((a, b) => a.scientific_name.localeCompare(b.scientific_name))
  const classId = new Map(species.map((item, index) => [item.id, index]))
  const manifest = { release_version: version, created_at: new Date().toISOString(), source: 'NSTRU Vision verified annotations', selection: 'status=verified with final_species_id and final_bbox only', images: ready.length, classes: species.length, skipped, class_map: species.map((item, index) => ({ id: index, ...item })) }

  const yolo = join(releaseRoot, 'yolo'); await mkdir(join(yolo, 'images'), { recursive: true }); await mkdir(join(yolo, 'labels'))
  for (const image of ready) {
    await copyFile(join(sourceImages, image.filename), join(yolo, 'images', image.filename))
    const { x, y, width, height } = image.box
    await writeFile(join(yolo, 'labels', `${basename(image.filename, extname(image.filename))}.txt`), `${classId.get(image.species.id)} ${((x + width / 2) / 100).toFixed(6)} ${((y + height / 2) / 100).toFixed(6)} ${(width / 100).toFixed(6)} ${(height / 100).toFixed(6)}\n`)
  }
  await writeFile(join(yolo, 'data.yaml'), `path: .\ntrain: images\nval: images\nnames:\n${species.map((item, index) => `  ${index}: ${item.scientific_name}`).join('\n')}\n`)
  await writeJson(join(yolo, 'manifest.json'), manifest)

  const coco = join(releaseRoot, 'coco'); await mkdir(join(coco, 'images'), { recursive: true })
  const cocoImages = []; const annotations = []
  for (const [index, image] of ready.entries()) {
    const id = index + 1; const { x, y, width, height } = image.box
    const pixelBox = [x / 100 * image.width, y / 100 * image.height, width / 100 * image.width, height / 100 * image.height]
    await copyFile(join(sourceImages, image.filename), join(coco, 'images', image.filename))
    cocoImages.push({ id, file_name: image.filename, width: image.width, height: image.height })
    annotations.push({ id, image_id: id, category_id: classId.get(image.species.id) + 1, bbox: pixelBox, area: pixelBox[2] * pixelBox[3], iscrowd: 0 })
  }
  await writeJson(join(coco, 'annotations.json'), { images: cocoImages, annotations, categories: species.map((item, index) => ({ id: index + 1, name: item.scientific_name, supercategory: 'snake' })) })
  await writeJson(join(coco, 'manifest.json'), manifest)

  const csvRoot = join(releaseRoot, 'csv'); await mkdir(join(csvRoot, 'images'), { recursive: true })
  const header = 'filename,species_id,scientific_name,name_th,name_en,x,y,width,height\n'
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  const lines = [header]
  for (const image of ready) {
    await copyFile(join(sourceImages, image.filename), join(csvRoot, 'images', image.filename))
    const { x, y, width, height } = image.box
    lines.push([image.filename, image.species.id, image.species.scientific_name, image.species.name_th, image.species.name_en, x / 100, y / 100, width / 100, height / 100].map(quote).join(',') + '\n')
  }
  await writeFile(join(csvRoot, 'dataset.csv'), lines.join(''), 'utf8')
  await writeJson(join(csvRoot, 'manifest.json'), manifest)

  const packages = join(releaseRoot, 'packages'); await mkdir(packages)
  for (const [folder, name] of [[yolo, 'yolo.zip'], [coco, 'coco.zip'], [csvRoot, 'csv.zip']]) {
    console.log(`Creating ${name}…`)
    await archiveFolder(folder, join(packages, name))
  }
  await writeJson(join(packages, 'manifest.json'), manifest)
  await Promise.all([rm(sourceImages, { recursive: true, force: true }), rm(yolo, { recursive: true, force: true }), rm(coco, { recursive: true, force: true }), rm(csvRoot, { recursive: true, force: true })])
  console.log(`Built ${ready.length} images across ${species.length} classes: ${packages}`)
  return packages
}

async function main() {
  const options = parseArguments()
  if (options.dryRun && options.upload) throw new Error('Use either --dry-run or --upload, not both.')
  const packages = await buildRelease(options.version, options.output, options.dryRun)
  if (!options.upload) return
  const repo = environment('HF_DATASET_REPO')
  console.log('Uploading to Hugging Face…')
  const result = spawnSync('hf', ['upload', repo, packages, `releases/${options.version}`, '--repo-type', 'dataset'], { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw new Error('Hugging Face CLI is not installed. Install it, run `hf auth login`, then retry.')
  if (result.status !== 0) throw new Error('Hugging Face upload failed.')
}

main().catch(error => { console.error(`\nPublish failed: ${error.message}`); process.exitCode = 1 })
