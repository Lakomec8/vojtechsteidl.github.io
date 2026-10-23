#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const dir="interactive-notes/mechanics-motion-forces";
const html=fs.readFileSync(`${dir}/index.html`,"utf8");
const css=fs.readFileSync(`${dir}/style.css`,"utf8");
const js=fs.readFileSync(`${dir}/app.js`,"utf8");

new vm.Script(js,{filename:"mechanics-motion-forces-app.js"});
const context={window:{},globalThis:{}};
vm.runInNewContext(js,context,{filename:"mechanics-motion-forces-app.js"});
const m=context.window.MechanicsModel;

assert(m,"Pure mechanics model must be exposed for regression tests");
assert.deepEqual({...m.relative(-1,5,-2)},{boatShore:3,personShore:2});
assert(Math.abs(m.averageEqualDistance(30,10,100).speed-15)<1e-9,"Equal-distance average must be harmonic");
assert.equal(m.averageEqualDistance(8,3,120).vector,0,"Return trip displacement must be zero");
assert(Math.abs(m.averageEqualTime(8,3,20).speed-5.5)<1e-9,"Equal-time average must be arithmetic");
assert(Math.abs(m.horizontal(20,90,.25).acceleration-2.0475)<1e-9,"Horizontal F=ma calculation changed");
assert(Math.abs(m.incline(10,30,.2).acceleration-3.2059)<.001,"Incline force decomposition changed");

assert.equal((html.match(/data-tab=/g)||[]).length,5,"Five lesson chapters must be navigable");
assert.equal((html.match(/<canvas\b/g)||[]).length,4,"Four linked visual laboratories are required");
assert(html.includes("MathJax")&&/free-body/i.test(html),"Math typography and FBD content missing");
assert(html.includes("Loď vůči vodě")&&html.includes("Proud vůči břehu"),"Boat/water/shore distinction missing");
assert(html.includes("Tíha není reakce podložky"),"Weight versus normal-force explanation missing");
assert(css.includes("@media(max-width:680px)"),"Responsive mobile layout missing");
assert(css.includes("prefers-reduced-motion"),"Reduced-motion support missing");
console.log("Mechanics: syntax, relative motion, averages, forces, FBD and responsive checks passed.");
