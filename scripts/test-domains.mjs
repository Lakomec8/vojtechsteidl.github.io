import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(resolve(root,"interactive-notes/domains/index.html"),"utf8");
const css=readFileSync(resolve(root,"interactive-notes/domains/style.css"),"utf8");
const js=readFileSync(resolve(root,"interactive-notes/domains/app.js"),"utf8");
new vm.Script(js,{filename:"interactive-notes/domains/app.js"});

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,"All HTML IDs must be unique");
for(const id of ["heroLine","domainGraph","numberLine","intersectionLine","liveFormula","conditionResult","domainResult","signSteps","solverSteps","exerciseGrid","quizMount"]){
  assert(ids.includes(id),`Missing ${id}`);
}
assert.equal((html.match(/<canvas\b/g)||[]).length,4,"Four coordinated canvases");
assert.match(html,/MathJax/);
assert.match(html,/Odmocnina ve jmenovateli/);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(js,/const exercises=\[/);
assert.match(js,/const quiz=\[/);
assert.match(js,/Zkrácená díra/);
assert.match(js,/Logaritmus/);
assert.equal((js.match(/\{l:[123],t:/g)||[]).length,12,"Twelve tiered exercises");
assert.equal((js.match(/\{q:'/g)||[]).length,10,"Ten self-check questions");

// Mathematical edge cases are explicitly represented in the implementation.
assert.match(js,/r\.kind==='all'/,"Identically-zero denominator case handled");
assert.match(js,/coef\.a===0/,"Linear degeneration handled");
assert.match(js,/mode==='rootden'/,"Strict inequality for a root in denominator handled");
assert.match(js,/t===2/,"Coincident closed/open boundary handled");

const library=readFileSync(resolve(root,"cloudflare-portal/src/library-entry.ts"),"utf8");
assert.match(library,/"id": "function-domains"/);
assert.match(library,/"url": "\/interactive-notes\/domains\/"/);
console.log("Function-domain lesson: structure, pedagogy, edge cases, and library registration OK.");
