import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'assets')
const ALLOWED = ['Tự tạo', 'CC0', 'CC-BY-4.0', 'CC-BY-3.0', 'OFL', 'Kenney', 'Pixabay']
const ALLOWED_PREFIX = ['Mua (', 'AI (']

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== 'source') walk(p, out) } else out.push(relative(ROOT, p).replace(/\\/g, '/'))
  }
  return out
}

it('mọi file trong assets/ (trừ source/) có mục CREDITS.json với license hợp lệ', () => {
  const credits = JSON.parse(readFileSync(join(ROOT, 'CREDITS.json'), 'utf8')) as { file: string; license: string }[]
  const byFile = new Map(credits.map(c => [c.file, c]))
  for (const f of walk(ROOT)) {
    if (f === 'CREDITS.json') continue
    const c = byFile.get(f)
    expect(c, `thiếu mục CREDITS cho ${f}`).toBeDefined()
    const ok = ALLOWED.includes(c!.license) || ALLOWED_PREFIX.some(p => c!.license.startsWith(p))
    expect(ok, `license không hợp lệ ở ${f}: ${c!.license}`).toBe(true)
  }
  for (const c of credits) expect(walk(ROOT)).toContain(c.file)
})
