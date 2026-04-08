/**
 * One-off migration: flat <ExecutionConsole ... /> and <PropertyPanel ... /> to grouped props.
 */
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function extractJsxSelfClosingBlock(source, startIdx, tagName) {
  const open = `<${tagName}`;
  if (source.slice(startIdx, startIdx + open.length) !== open) {
    return null;
  }
  let pos = startIdx + open.length;
  const firstNl = source.indexOf("\n", pos);
  if (firstNl === -1) {
    return null;
  }
  pos = firstNl + 1;
  const propLines = [];
  while (pos < source.length) {
    const lineEnd = source.indexOf("\n", pos);
    const line =
      lineEnd === -1 ? source.slice(pos) : source.slice(pos, lineEnd);
    const closeCandidate = line.trim().replace(/,\s*$/, "");
    if (closeCandidate === "/>") {
      const closeIndent = line.match(/^(\s*)/)?.[1] ?? "      ";
      const closeComma = /,\s*$/.test(line.trimEnd()) ? "," : "";
      const end = lineEnd === -1 ? source.length : lineEnd + 1;
      return { propLines, end, closeIndent, closeComma };
    }
    propLines.push(line);
    if (lineEnd === -1) {
      break;
    }
    pos = lineEnd + 1;
  }
  return null;
}

function parsePropAssignments(propLines) {
  const props = [];
  for (const raw of propLines) {
    const line = raw.trim().replace(/,\s*$/, "");
    if (!line) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    props.push({ key, value });
  }
  return props;
}

/** JSX prop={expr} becomes `expr` here; avoid `{foo}` → `foo: {foo}` invalid object literal. */
function jsxExpressionToObjectValue(value) {
  const v = value.trim();
  const m = /^\{([\s\S]*)\}$/.exec(v);
  if (!m) {
    return v;
  }
  const inner = m[1].trim();
  if (
    inner === "[]" ||
    inner === "null" ||
    inner === "undefined" ||
    /^[a-zA-Z_$][\w$.]*$/.test(inner) ||
    /^\[[^\]]*\]$/.test(inner)
  ) {
    return inner;
  }
  return v;
}

function buildEcSpread(props) {
  const parts = props.map(
    ({ key, value }) => `${key}: ${jsxExpressionToObjectValue(value)}`,
  );
  return `{...ec({ ${parts.join(", ")} })}`;
}

function buildPpSpread(props) {
  const parts = props.map(
    ({ key, value }) => `${key}: ${jsxExpressionToObjectValue(value)}`,
  );
  return `{...pp({ ${parts.join(", ")} })}`;
}

function migrateFile(path, tagName, buildSpread, helperName) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(`{...${helperName}({`)) {
    console.log("skip (already migrated):", path);
    return;
  }
  let out = "";
  let i = 0;
  const open = `<${tagName}`;
  while (i < source.length) {
    const idx = source.indexOf(open, i);
    if (idx === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, idx);
    const block = extractJsxSelfClosingBlock(source, idx, tagName);
    if (!block) {
      out += source[idx];
      i = idx + 1;
      continue;
    }
    const props = parsePropAssignments(block.propLines);
    const closeIndent = block.closeIndent ?? "      ";
    const closeComma = block.closeComma ?? "";
    const innerIndent = `${closeIndent}  `;
    const spread = buildSpread(props);
    out += `${open}\n${innerIndent}${spread}\n${closeIndent}/>${closeComma}`;
    i = block.end;
  }
  fs.writeFileSync(path, out);
  console.log("migrated:", path);
}

const ecFiles = [
  join(root, "src/components/ExecutionConsole.test.jsx"),
  join(root, "src/components/ExecutionConsole.additional.test.jsx"),
];
const ppFile = join(root, "src/components/PropertyPanel.test.jsx");

for (const f of ecFiles) {
  migrateFile(f, "ExecutionConsole", buildEcSpread, "ec");
}
migrateFile(ppFile, "PropertyPanel", buildPpSpread, "pp");
