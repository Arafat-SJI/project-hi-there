import fs from "fs";
import path from "path";

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(f)) acc.push(p);
  }
  return acc;
}

const names = new Set();
const re1 = /functions\.invoke\(\s*["']([a-z0-9-]+)["']/g;
const re2 = /invokeEdgeFunction\(\s*["']([a-z0-9-]+)["']/g;

for (const f of walk("src")) {
  const t = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re1.exec(t))) names.add(m[1]);
  while ((m = re2.exec(t))) names.add(m[1]);
}

const api = fs.readFileSync("src/shared/config/api.ts", "utf8");
const reApi = /:\s*["']([a-z0-9-]+)["']/g;
let m;
while ((m = reApi.exec(api))) names.add(m[1]);

for (const f of ["src/hooks/usePMSync.ts", "src/hooks/useIntegrationSync.ts"]) {
  const t = fs.readFileSync(f, "utf8");
  const re = /["'](sync-[a-z0-9-]+)["']/g;
  while ((m = re.exec(t))) names.add(m[1]);
}

const sorted = [...names].sort();
console.log("COUNT", sorted.length);
for (const n of sorted) console.log(n);
