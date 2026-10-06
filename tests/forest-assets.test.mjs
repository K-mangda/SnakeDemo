import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const asset = name => new URL(`../public/forest/${name}`, import.meta.url)

test('the homepage loop ships locally as a small, fast-start H.264 MP4', async () => {
  const video = await readFile(asset('forest-loop.mp4'))
  assert.equal(video.toString('ascii', 4, 8), 'ftyp')
  assert.ok(video.includes(Buffer.from('avc1')), 'H.264 is required for browser compatibility')
  const movie = video.indexOf(Buffer.from('moov'))
  const media = video.indexOf(Buffer.from('mdat'))
  assert.ok(movie >= 0 && movie < media, 'Metadata must precede frames for fast playback')
  assert.ok(video.length < 1_000_000, 'Keep the ambient loop below 1 MB')
})

for (const filename of ['forest-poster.webp', 'downstream-poster.webp']) {
  test(`${filename} is a local, compressed fallback`, async () => {
    const image = await readFile(asset(filename))
    assert.equal(image.toString('ascii', 0, 4), 'RIFF')
    assert.equal(image.toString('ascii', 8, 12), 'WEBP')
    assert.ok(image.length < 500_000)
  })
}
