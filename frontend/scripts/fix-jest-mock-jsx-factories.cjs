/**
 * Rewrites jest.mock(..., () => ({ ... factories using jsx/jsxs ... }))
 * so runtime helpers come from require() inside the factory (Jest hoisting-safe).
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

function walkDir(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkDir(p, acc);
    else if (name.endsWith('.test.jsx')) acc.push(p);
  }
  return acc;
}

function nodeContainsJsxHelper(node) {
  if (!node) return false;
  let found = false;
  traverse(node, {
    noScope: true,
    Identifier(p) {
      const n = p.node.name;
      if (n !== 'jsx' && n !== 'jsxs' && n !== 'Fragment') return;
      const { parent } = p;
      if (t.isObjectProperty(parent) && parent.key === p.node) return;
      if (t.isMemberExpression(parent) && parent.property === p.node && !parent.computed) return;
      found = true;
      p.stop();
    },
  });
  return found;
}

function factoryAlreadyPatched(factory) {
  if (!t.isBlockStatement(factory.body)) return false;
  const [first] = factory.body.body;
  if (!t.isVariableDeclaration(first)) return false;
  const d = first.declarations[0];
  if (!d || !t.isCallExpression(d.init) || d.init.callee.name !== 'require') return false;
  const arg = d.init.arguments[0];
  return t.isStringLiteral(arg) && arg.value === 'react/jsx-runtime';
}

function extractObjectExpressionFromFactory(factory) {
  const { body } = factory;
  if (t.isObjectExpression(body)) return body;
  if (t.isParenthesizedExpression(body) && t.isObjectExpression(body.expression)) {
    return body.expression;
  }
  return null;
}

function transformFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  traverse(ast, {
    CallExpression(p) {
      const { callee } = p.node;
      if (!t.isMemberExpression(callee)) return;
      if (!t.isIdentifier(callee.object, { name: 'jest' })) return;
      if (!t.isIdentifier(callee.property, { name: 'mock' })) return;
      if (p.node.arguments.length < 2) return;

      const factory = p.node.arguments[1];
      if (!t.isArrowFunctionExpression(factory) && !t.isFunctionExpression(factory)) return;
      if (factoryAlreadyPatched(factory)) return;

      const obj = extractObjectExpressionFromFactory(factory);
      if (!obj) return;
      if (!nodeContainsJsxHelper(obj)) return;

      const requireDecl = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(t.identifier('jsx'), t.identifier('jsx'), false, true),
            t.objectProperty(t.identifier('jsxs'), t.identifier('jsxs'), false, true),
            t.objectProperty(t.identifier('Fragment'), t.identifier('Fragment'), false, true),
          ]),
          t.callExpression(t.identifier('require'), [t.stringLiteral('react/jsx-runtime')])
        ),
      ]);

      factory.body = t.blockStatement([requireDecl, t.returnStatement(obj)]);
      if (t.isArrowFunctionExpression(factory)) factory.expression = false;
      changed = true;
    },
  });

  if (!changed) return false;
  const out = generate(ast, { retainLines: false }, code).code;
  fs.writeFileSync(filePath, `${out}\n`);
  return true;
}

const root = path.join(__dirname, '..', 'src');
let n = 0;
for (const f of walkDir(root)) {
  if (transformFile(f)) {
    n += 1;
    console.log('patched', path.relative(path.join(__dirname, '..'), f));
  }
}
console.log(`Done. Patched ${n} file(s).`);
