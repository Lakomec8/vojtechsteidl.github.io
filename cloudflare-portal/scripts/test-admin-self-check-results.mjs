import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/admin-self-check-results.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
});
const assignment = {
  id: "assign-1", student_id: "student-1", display_name: "Karolína Lhotská",
  test_id: "test-waves", title: "Mechanické vlnění", topic: "Fyzika"
};
const attempts = [
  { id: "attempt-new", score: 1, max_score: 3, submitted_at: "2026-10-19T07:00:00Z" },
  { id: "attempt-old", score: 3, max_score: 3, submitted_at: "2026-10-18T08:00:00Z" }
];
const options = JSON.stringify([
  { id: "a", label: "[[math:\\lambda=2\\,\\mathrm{m}]]" },
  { id: "b", label: "4 m" }
]);
const latestAnswers = [
  {
    position: 1,
    prompt: JSON.stringify({ instruction: "Spočti vlnovou délku", math: "\\lambda=v/f", category: "Vlnová délka" }),
    options_json: options,
    correct_answer: "a", explanation: "Použij [[math:\\lambda=v/f]].",
    points: 2, answer_value: "b", is_correct: 0, points_awarded: 0
  },
  {
    position: 2, prompt: "Co přenáší vlna?", options_json: JSON.stringify([
      { id: "a", label: "Energii" }, { id: "b", label: "Látku jako celek" }
    ]),
    correct_answer: "a", explanation: "Přenáší energii.", points: 1,
    answer_value: "a", is_correct: 1, points_awarded: 1
  }
];
let admin = true, noAttempts = false;
const queries = [];
const env = {
  DB: {
    prepare(sql) {
      if (/^\s*(?:INSERT|UPDATE|DELETE|DROP|ALTER)\b/i.test(sql)) {
        throw new Error("Report must not mutate DB");
      }
      queries.push(sql);
      return {
        bind(...args) {
          return {
            async first() {
              assert.match(sql,/FROM self_check_assignments/);
              assert.deepEqual(args,["assign-1"]);
              return assignment;
            },
            async all() {
              if (sql.includes("FROM self_check_attempts")) {
                assert.deepEqual(args,["assign-1","student-1","test-waves"]);
                return { results: noAttempts ? [] : attempts };
              }
              if (sql.includes("FROM self_check_questions")) {
                assert.equal(args[1],"test-waves");
                return { results: args[0] === "attempt-old" ? latestAnswers.map(x=>({...x,answer_value:x.correct_answer,is_correct:1,points_awarded:x.points})) : latestAnswers };
              }
              throw new Error("Unexpected SQL: "+sql);
            }
          };
        }
      };
    }
  }
};
class PortalError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
const moduleExports={};
const mockEntry={
  PortalError,
  async principalForRequest(){return {isAdmin:admin};},
  privateHeaders(){return new Headers({"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow, noarchive"});}
};
const load = new Function("require","exports",compiled.outputText);
load((name)=>{assert.equal(name,"./entry");return mockEntry;},moduleExports);
const view=moduleExports.adminSelfCheckResults;
assert.equal(typeof view,"function");

const request=(suffix="",method="GET")=>new Request("https://vojtechsteidl.eu/student-portal/admin/self-checks/results/assign-1"+suffix,{method});
async function page(suffix=""){
  const response=await view(request(suffix),env,"assign-1");
  assert.equal(response.status,200);
  assert.match(response.headers.get("cache-control"),/private/);
  assert.match(response.headers.get("x-robots-tag"),/noindex/);
  return response.text();
}
const latest=await page();
assert.match(latest,/Karolína Lhotská/);
assert.match(latest,/Mechanické vlnění/);
assert.match(latest,/Historie pokusů/);
assert.match(latest,/Pokus 2/);
assert.match(latest,/Vybráno studentem/);
assert.match(latest,/Správná odpověď/);
assert.match(latest,/Vlnová délka: <strong>1 z 1 chybně/);
assert.match(latest,/Jen chyby \(1\)/);
assert.match(latest,/data-tex="\\lambda=v\/f"/);
assert.match(latest,/1 \/ 2/);
assert.match(latest,/1\/3 b\./);

const errors=await page("?filter=errors");
assert.match(errors,/Spočti vlnovou délku/);
assert.doesNotMatch(errors,/Co přenáší vlna\?/);

const old=await page("?attempt=attempt-old");
assert.match(old,/3\/3 b\./);
assert.match(old,/Bez chyb\./);
assert.match(old,/Správně/);

await assert.rejects(()=>view(request("?attempt=other-student-attempt"),env,"assign-1"),error=>error.status===404);
admin=false;
const countBefore=queries.length;
await assert.rejects(()=>view(request(),env,"assign-1"),error=>error.status===403);
assert.equal(queries.length,countBefore,"Student must not query other students' attempts");
admin=true;
await assert.rejects(()=>view(request("","POST"),env,"assign-1"),error=>error.status===405);
noAttempts=true;
const empty=await page();
assert.match(empty,/Student zatím neodevzdal žádný pokus/);
noAttempts=false;
assert.equal(queries.some(x=>!x.startsWith("SELECT")),false);
console.log("Admin self-check review passed: history, answer labels, mistakes, categories, authorization, read-only DB, and no-attempt state.");
