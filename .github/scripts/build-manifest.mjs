// 扫描内容目录，生成 manifest.json，供前端直接读取（不消耗 GitHub API 额度）
// 用法：node .github/scripts/build-manifest.mjs
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'

const ROOTS = ['novels', 'images', 'musics']
const IGNORE_FILES = new Set(['README.md', '.gitkeep', '.DS_Store'])

function walk(dir) {
  const result = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORE_FILES.has(entry.name)) continue
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      result.push(...walk(path))
    } else {
      result.push({ path, name: entry.name, size: statSync(path).size })
    }
  }
  return result
}

const files = []
for (const root of ROOTS) {
  if (existsSync(root)) files.push(...walk(root))
}
files.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'))

const manifest = {
  generatedAt: new Date().toISOString(),
  files
}

writeFileSync('manifest.json', `${JSON.stringify(manifest, null, 1)}\n`)
console.log(`manifest.json: ${files.length} files`)
