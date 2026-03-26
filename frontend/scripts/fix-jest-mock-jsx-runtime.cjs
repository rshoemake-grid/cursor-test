/**
 * Jest forbids jest.mock factories from closing over imported _jsx/_jsxs.
 * Inline require('react/jsx-runtime') inside those factories.
 */
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const { globSync } = require('glob')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'src')

function usesJsxRuntimeId(bodyPath) {
  let uses = false
  bodyPath.traverse({
    Identifier(p) {
      const n = p.node.name
      if (n === '_jsx' || n === '_jsxs' || n === '_Fragment') {
        uses = true
        p.stop()
      }
    },
  })
  return uses
}

function jsxRuntimeRequireDeclaration() {
  return t.variableDeclaration('const', [
    t.variableDeclarator(
      t.objectPattern([
        t.objectProperty(t.identifier('jsx'), t.identifier('_jsx'), false, true),
        t.objectProperty(t.identifier('jsxs'), t.identifier('_jsxs'), false, true),
        t.objectProperty(t.identifier('Fragment'), t.identifier('_Fragment'), false, true),
      ]),
      t.callExpression(t.identifier('require'), [t.stringLiteral('react/jsx-runtime')])
    ),
  ])
}

function blockAlreadyRequiresJsxRuntime(block) {
  for (const stmt of block.body) {
    if (!t.isVariableDeclaration(stmt)) continue
    const d0 = stmt.declarations[0]
    if (!d0 || !t.isVariableDeclarator(d0) || !t.isObjectPattern(d0.id)) continue
    if (!t.isCallExpression(d0.init) || !t.isIdentifier(d0.init.callee, { name: 'require' }))
      continue
    const arg0 = d0.init.arguments[0]
    if (t.isStringLiteral(arg0) && arg0.value === 'react/jsx-runtime') return true
  }
  return false
}

function fixFile(absPath) {
  const code = fs.readFileSync(absPath, 'utf8')
  if (!code.includes('jest.mock') || !code.includes('_jsx')) return false

  let ast
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      plugins: ['jsx', 'importMeta', 'classProperties', 'topLevelAwait'],
    })
  } catch (e) {
    console.error('parse fail', absPath, e.message)
    return false
  }

  let changed = false
  traverse(ast, {
    CallExpression(p) {
      const { callee, arguments: args } = p.node
      if (!t.isMemberExpression(callee)) return
      if (!t.isIdentifier(callee.object, { name: 'jest' })) return
      if (!t.isIdentifier(callee.property, { name: 'mock' })) return
      if (args.length < 2) return
      const factory = args[1]
      if (!t.isArrowFunctionExpression(factory)) return

      const factoryPath = p.get('arguments')[1]
      if (!usesJsxRuntimeId(factoryPath)) return

      const body = factory.body

      if (t.isBlockStatement(body)) {
        if (blockAlreadyRequiresJsxRuntime(body)) return
        body.body.unshift(jsxRuntimeRequireDeclaration())
        changed = true
        return
      }

      if (t.isObjectExpression(body)) {
        factory.body = t.blockStatement([jsxRuntimeRequireDeclaration(), t.returnStatement(body)])
        changed = true
        return
      }

      factory.body = t.blockStatement([jsxRuntimeRequireDeclaration(), t.returnStatement(body)])
      changed = true
    },
  })

  if (!changed) return false

  const out = generate(ast, { retainLines: false, compact: false }, code).code
  fs.writeFileSync(absPath, out, 'utf8')
  return true
}

const files = globSync('**/*.{test.js,test.jsx}', {
  cwd: srcDir,
  absolute: true,
  posix: false,
})
let n = 0
for (const f of files) {
  if (fixFile(f)) {
    n++
    console.error('fixed', path.relative(root, f))
  }
}
console.error(`jest.mock jsx-runtime fix: ${n} files`)
