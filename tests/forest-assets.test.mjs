import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
test('approved river loop remains a local fast-start H264 asset', async () => {
  const video = await readFile(new URL('../public/forest/forest-loop.mp4', import.meta.url))
  assert.equal(video.toString('ascii', 4, 8), 'ftyp')
  assert.ok(video.includes(Buffer.from('avc1')))
  const moov = video.indexOf(Buffer.from('moov'))
  assert.ok(moov >= 0 && moov < video.indexOf(Buffer.from('mdat')))
  assert.ok(video.length < 1000000)
})
test('homepage uses a video-frame image while the clip loads', async () => {
  const poster = await readFile(new URL('../public/forest/forest-loop-poster.webp', import.meta.url))
  assert.equal(poster.toString('ascii', 8, 12), 'WEBP')
  assert.ok(poster.length < 300000)
  const css = await source('components/home/forest.module.css')
  const player = await source('components/home/ForestExperience.tsx')
  assert.match(css, /forest-loop-poster\.webp/)
  assert.match(player, /poster="\/forest\/forest-loop-poster\.webp"/)
})
test('homepage uses approved video without the rejected depth scene', async () => {
  const home = await source('components/home/ForestExperience.tsx')
  assert.match(home, /<video/)
  assert.match(home, /forest-loop.mp4/)
  assert.doesNotMatch(home, /<ForestScene/)
  assert.match(home, /data-testid="continuous-landscape"/)
  assert.match(home, /prefers-reduced-motion/)
})
test('the homepage explains image suggestions without claiming certainty', async () => {
  const page = await source('app/page.tsx')
  assert.match(page, /possible species suggestion/)
  assert.match(page, /not a medical diagnosis/)
  assert.match(page, /not a safety decision/)
})
test('homepage retains working destinations and original navigation theme', async () => {
  const page = await source('app/page.tsx')
  assert.match(page, /href="\/predict"/)
  assert.match(page, /id="guide"/)
  assert.match(page, /id="species"/)
  const nav = await source('components/layout/Navbar.tsx')
  assert.match(nav, /bg-zinc-950\/80/)
  assert.match(nav, /text-emerald-500/)
})
