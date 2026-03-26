// One-shot: transpile all src TypeScript files to .js/.jsx with SWC, then delete sources.
// Run: node scripts/convert-ts-to-js.mjs
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { transformSync } from '@swc/core'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')
const srcDir = join(root, 'src')

const patterns = ['**/*.ts', '**/*.tsx']
const files = globSync(patterns, {
  cwd: srcDir,
  posix: true,
  ignore: ['**/node_modules/**'],
})

function toOutPath(relPosix) {
  if (relPosix.endsWith('.tsx')) return relPosix.replace(/\.tsx$/, '.jsx')
  return relPosix.replace(/\.ts$/, '.js')
}

let ok = 0
let fail = 0

for (const rel of files.sort()) {
  const absIn = join(srcDir, rel)
  const isTsx = rel.endsWith('.tsx')
  const outRel = toOutPath(rel)
  const absOut = join(srcDir, outRel)

  if (absIn === absOut) continue

  const code = readFileSync(absIn, 'utf8')
  try {
    const out = transformSync(code, {
      filename: absIn,
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: isTsx,
          decorators: false,
          dynamicImport: true,
        },
        transform: {
          react: { runtime: 'automatic' },
        },
        target: 'es2020',
        loose: false,
        externalHelpers: false,
      },
      module: {
        type: 'es6',
        strict: false,
        ignoreDynamic: true,
      },
      sourceMaps: false,
    })

    mkdirSync(dirname(absOut), { recursive: true })
    writeFileSync(absOut, out.code, 'utf8')
    unlinkSync(absIn)
    ok++
    if (ok % 100 === 0) console.error(`… ${ok} files`)
  } catch (e) {
    console.error('FAIL', rel, e.message)
    fail++
  }
}

console.error(`Done: ${ok} converted, ${fail} failed`)

if (fail > 0) process.exit(1)
