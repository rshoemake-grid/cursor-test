/**
 * Collapses verbose destructuring from jest.mock() bodies to only used jsx/jsxs/Fragment.
 */
const fs = require("fs");
const path = require("path");

function walkDir(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkDir(p, acc);
    else if (name.endsWith(".test.jsx")) acc.push(p);
  }
  return acc;
}

const REQUIRE_RX =
  /const\s*\{\s*jsx\s*,\s*jsxs\s*,\s*Fragment\s*\}\s*=\s*require\(["']react\/jsx-runtime["']\)\s*;/g;

function patchContent(content) {
  let any = false;
  const out = content.replace(REQUIRE_RX, (match, offset) => {
    const windowEnd = Math.min(content.length, offset + 1500);
    const body = content.slice(offset + match.length, windowEnd);
    const parts = [];
    if (/[^a-zA-Z0-9_$]jsx\s*\(/.test(body)) parts.push("jsx");
    if (/[^a-zA-Z0-9_$]jsxs\s*\(/.test(body)) parts.push("jsxs");
    if (/\bjsxs\s*\(\s*Fragment\b/.test(body)) parts.push("Fragment");
    if (parts.length === 0) return match;
    const destr = `const { ${parts.join(", ")} } = require("react/jsx-runtime");`;
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    if (norm(destr) !== norm(match)) any = true;
    return destr;
  });
  return { out, changed: any };
}

let n = 0;
for (const file of walkDir(path.join(__dirname, "..", "src"))) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("jsx") || !src.includes("require(\"react/jsx-runtime\")")) continue;
  const { out, changed } = patchContent(src);
  if (changed) {
    fs.writeFileSync(file, out.endsWith("\n") ? out : `${out}\n`);
    n++;
    console.log(path.relative(path.join(__dirname, ".."), file));
  }
}
console.log(`Updated ${n} file(s).`);
