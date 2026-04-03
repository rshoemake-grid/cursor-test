/**
 * Codemod: rewrite react/jsx-runtime jsx/jsxs() calls into normal JSX syntax.
 * Run from repo root: node frontend/scripts/restore-jsx.cjs
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const SRC = path.join(__dirname, "..", "src");

function isJsxRuntimeCallee(callee) {
  if (t.isIdentifier(callee) && (callee.name === "jsx" || callee.name === "jsxs")) {
    return callee.name;
  }
  return null;
}

function typeToJsxName(typeArg) {
  if (t.isStringLiteral(typeArg)) {
    return t.jsxIdentifier(typeArg.value);
  }
  if (t.isIdentifier(typeArg)) {
    return t.jsxIdentifier(typeArg.name);
  }
  if (t.isMemberExpression(typeArg)) {
    return memberToJsxName(typeArg);
  }
  throw new Error(`Unsupported JSX type: ${typeArg.type}`);
}

function memberToJsxName(node) {
  if (t.isIdentifier(node)) {
    return t.jsxIdentifier(node.name);
  }
  if (t.isMemberExpression(node) && !node.computed) {
    return t.jsxMemberExpression(memberToJsxName(node.object), t.jsxIdentifier(node.property.name));
  }
  throw new Error(`Unsupported member expression for JSX name`);
}

function jsxAttributeValueFromPropValue(value) {
  if (t.isStringLiteral(value)) {
    const s = value.value;
    if (/["\n\r]/.test(s)) {
      return t.jsxExpressionContainer(t.stringLiteral(s));
    }
    return t.stringLiteral(s);
  }
  if (t.isBooleanLiteral(value) || t.isNumericLiteral(value)) {
    return t.jsxExpressionContainer(value);
  }
  return t.jsxExpressionContainer(value);
}

function propsToAttributes(propsArg, { skipChildren }) {
  if (!propsArg || t.isNullLiteral(propsArg)) {
    return [];
  }
  if (!t.isObjectExpression(propsArg)) {
    throw new Error(`Expected object expression for JSX props, got ${propsArg.type}`);
  }
  const attrs = [];
  for (const prop of propsArg.properties) {
    if (t.isSpreadElement(prop)) {
      attrs.push(t.jsxSpreadAttribute(prop.argument));
      continue;
    }
    if (!t.isObjectProperty(prop)) {
      continue;
    }
    const key = prop.key;
    const name =
      t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;
    if (name == null) {
      throw new Error("Unsupported object key in JSX props");
    }
    if (skipChildren && name === "children") {
      continue;
    }
    const attrId = t.jsxIdentifier(name);
    attrs.push(t.jsxAttribute(attrId, jsxAttributeValueFromPropValue(prop.value)));
  }
  return attrs;
}

function buildJsxChildren(childrenValue) {
  if (childrenValue == null || t.isNullLiteral(childrenValue)) {
    return [];
  }
  if (t.isStringLiteral(childrenValue)) {
    if (childrenValue.value === "") {
      return [];
    }
    return [t.jsxText(childrenValue.value)];
  }
  if (t.isJSXElement(childrenValue) || t.isJSXFragment(childrenValue)) {
    return [childrenValue];
  }
  if (t.isCallExpression(childrenValue) && isJsxRuntimeCallee(childrenValue.callee)) {
    return [callToJsx(childrenValue)];
  }
  if (t.isArrayExpression(childrenValue)) {
    const out = [];
    for (const el of childrenValue.elements) {
      if (el == null) {
        continue;
      }
      if (t.isStringLiteral(el)) {
        out.push(t.jsxText(el.value));
      } else if (t.isCallExpression(el) && isJsxRuntimeCallee(el.callee)) {
        out.push(callToJsx(el));
      } else if (t.isJSXElement(el) || t.isJSXFragment(el)) {
        out.push(el);
      } else {
        out.push(t.jsxExpressionContainer(el));
      }
    }
    return out;
  }
  return [t.jsxExpressionContainer(childrenValue)];
}

function getChildrenProp(propsArg) {
  if (!t.isObjectExpression(propsArg)) {
    return null;
  }
  for (const prop of propsArg.properties) {
    if (!t.isObjectProperty(prop)) {
      continue;
    }
    const key = prop.key;
    const name = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;
    if (name === "children") {
      return prop.value;
    }
  }
  return null;
}

function callToJsx(call) {
  const kind = isJsxRuntimeCallee(call.callee);
  if (!kind) {
    throw new Error("Not a jsx/jsxs call");
  }
  const typeArg = call.arguments[0];
  const propsArg = call.arguments[1] || t.objectExpression([]);

  if (t.isIdentifier(typeArg) && typeArg.name === "Fragment") {
    const ch = getChildrenProp(propsArg);
    const children = buildJsxChildren(ch);
    return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);
  }

  const name = typeToJsxName(typeArg);
  const attrs = propsToAttributes(propsArg, { skipChildren: true });
  const keyArg = call.arguments[2];
  if (keyArg !== undefined && keyArg !== null) {
    attrs.unshift(
      t.jsxAttribute(t.jsxIdentifier("key"), t.jsxExpressionContainer(keyArg))
    );
  }
  const childrenVal = getChildrenProp(propsArg);
  const children = buildJsxChildren(childrenVal);
  const selfClosing = children.length === 0;

  const opening = t.jsxOpeningElement(name, attrs, selfClosing);
  if (selfClosing) {
    return t.jsxElement(opening, null, [], true);
  }
  const closing = t.jsxClosingElement(name);
  return t.jsxElement(opening, closing, children, false);
}

function stripPureComments(ast) {
  traverse(ast, {
    enter(p) {
      const { node } = p;
      if (node.leadingComments) {
        node.leadingComments = node.leadingComments.filter(
          (c) => !String(c.value).includes("__PURE__")
        );
      }
    }
  });
}

function transformJsxRuntimeImports(ast) {
  let usedFragment = false;
  traverse(ast, {
    CallExpression(p) {
      const k = isJsxRuntimeCallee(p.node.callee);
      if (!k) {
        return;
      }
      const typeArg = p.node.arguments[0];
      if (t.isIdentifier(typeArg) && typeArg.name === "Fragment") {
        usedFragment = true;
      }
    }
  });

  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      if (src !== "react/jsx-runtime") {
        return;
      }
      const specs = p.node.specifiers.filter((s) => {
        if (!t.isImportSpecifier(s)) {
          return true;
        }
        const n = s.imported.name || s.imported.value;
        return n !== "jsx" && n !== "jsxs" && n !== "Fragment";
      });
      if (specs.length === 0) {
        p.remove();
      } else {
        p.node.specifiers = specs;
      }
    }
  });

  if (usedFragment) {
    let hasReactImport = false;
    traverse(ast, {
      ImportDeclaration(p) {
        if (p.node.source.value === "react") {
          hasReactImport = true;
          const hasFrag = p.node.specifiers.some(
            (s) => t.isImportSpecifier(s) && s.imported.name === "Fragment"
          );
          if (!hasFrag) {
            p.node.specifiers.unshift(
              t.importSpecifier(t.identifier("Fragment"), t.identifier("Fragment"))
            );
          }
        }
      }
    });
    if (!hasReactImport) {
      ast.program.body.unshift(
        t.importDeclaration(
          [t.importSpecifier(t.identifier("Fragment"), t.identifier("Fragment"))],
          t.stringLiteral("react")
        )
      );
    }
  }
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("react/jsx-runtime")) {
    return false;
  }
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
    errorRecovery: false
  });

  traverse(ast, {
    CallExpression: {
      exit(p) {
        if (!isJsxRuntimeCallee(p.node.callee)) {
          return;
        }
        try {
          const replacement = callToJsx(p.node);
          p.replaceWith(replacement);
        } catch (e) {
          throw new Error(`${filePath}: ${e.message}`);
        }
      }
    }
  });

  stripPureComments(ast);
  transformJsxRuntimeImports(ast);

  const out = generate(ast, { retainLines: false, compact: false }, code).code;
  fs.writeFileSync(filePath, `${out.replace(/\s+$/, "")}\n`, "utf8");
  return true;
}

function walkDir(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkDir(full, acc);
    } else if (name.endsWith(".jsx")) {
      acc.push(full);
    }
  }
}

const files = [];
walkDir(SRC, files);
let n = 0;
for (const f of files) {
  if (processFile(f)) {
    n += 1;
    console.log("restored JSX:", path.relative(SRC, f));
  }
}
console.log(`Done. Updated ${n} file(s).`);
