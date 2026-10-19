import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the actual route handler, including the authorization boundaries,
// without a database connection or a student's private data.
const source = readFileSync(new URL("../src/self-checks.ts", import.meta.url), "utf8");
const converted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
});
const mockAssignment = {
  id: "assignment-a", test_id: "test-one", title: "Vlnění",
  topic: "Fáze"
};
const attempts = [
  { id: "attempt-new", score: 1, max_score: 3, submitted_at: "2026-10-19T08:00:00Z" },
  { id: "attempt-old", score: 3, max_score: 3, submitted_at: "2026-10-18T08:00:00Z" }
];
const answers = [
  {
    id: "question-a", position: 1,
    prompt: JSON.stringify({ instruction: "Fázový rozdíl", math: "2\\pi", category: "Fáze" }),
    options_json: JSON.stringify([{ id: "a", label: "0" }, { id: "b", label: "π" }]),
    correct_answer: "b", explanation: "Fáze je π.",
    points: 2, answer_value: "a", is_correct: 0, points_awarded: 0
  },
  {
    id: "question-b", position: 2, prompt: "Základní otázka",
    options_json: JSON.stringify([{ id: "a", label: "Energie" }, { id: "b", label: "Látka" }]),
    correct_answer: "a", explanation: "Energie se přenáší.",
    points: 1, answer_value: "a", is_correct: 1, points_awarded: 1
  }
];
let currentStudent="student-a", isAdmin=false, authorized=true, noHistory=false;
const dbStatements=[];
const env = {
  DB:{
    prepare(sql){
      assert.match(sql,/^\s*SELECT\b/i,"History view must read, not mutate, the database");
      dbStatements.push(sql);
      return {
        bind(...args){
          return {
            async first(){
              if(sql.includes("FROM self_check_assignments a")) {
                assert.equal(args[0],"assignment-a");
                return args[1] === "student-a" ? mockAssignment : null;
              }
              throw Error("Unexpected single-row query: "+sql);
            },
            async all(){
              if(sql.includes("FROM self_check_attempts")) {
                assert.deepEqual(args,["assignment-a",currentStudent,"test-one"]);
                return {results:noHistory?[]:attempts};
              }
              if(sql.includes("FROM self_check_questions q")) {
                assert.equal(args[1],"test-one");
                return {results:args[0] === "attempt-old"
                  ? answers.map(a=>({...a,answer_value:a.correct_answer,is_correct:1,points_awarded:a.points}))
                  : answers};
              }
              throw Error("Unexpected list query: "+sql);
            }
          };
        }
      };
    }
  }
};
class PortalError extends Error{constructor(status,message){super(message);this.status=status;}}
const stub={
  PortalError,
  async principalForRequest(){
    if(!authorized)throw new PortalError(403,"Not authorized");
    return {student:isAdmin?null:{id:currentStudent,display_name:"Student",material_path:"student"},isAdmin};
  },
  async selectedStudentForPrincipal(_request,_env,principal){
    if(!principal.student && !principal.isAdmin)throw new PortalError(403,"Forbidden");
    return principal.student || {id:currentStudent,display_name:"Student",material_path:"student"};
  },
  privateHeaders(){return new Headers({"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"});}
};
const exported={};
new Function("require","exports",converted.outputText)((name)=>{
  if(name==="./entry")return stub;
  if(name==="./student-learning")return {selfCheckSummaryForStudent() {throw Error("Not a submission");}};
  if(name==="./admin-self-check-results")return {adminSelfCheckResults(){throw Error("Not admin page");}};
  throw Error("Unexpected module "+name);
},exported);
const handle=exported.handleSelfCheckRoute;
const address="https://vojtechsteidl.eu/student-portal/api/self-checks/assignment-a/results";
const call=async (suffix="",method="GET")=>handle(new Request(address+suffix,{method}),env);
const fresh=await call();
assert.equal(fresh.status,200);
assert.match(fresh.headers.get("cache-control"),/no-store/);
const payload=await fresh.json();
assert.equal(payload.saved,true);
assert.equal(payload.readOnly,true);
assert.equal(payload.preview,false);
assert.equal(payload.score,1);
assert.equal(payload.maxScore,3);
assert.equal(payload.percent,33);
assert.equal(payload.history.length,2);
assert.equal(payload.attemptId,"attempt-new");
assert.equal(payload.results.length,2);
assert.equal(payload.results[0].correct,false);
assert.equal(payload.results[0].answer,"a");
assert.equal(payload.results[0].correctAnswer,"b");
assert.equal(payload.results[0].pointsAwarded,0);
assert.equal(payload.results[1].correct,true);
assert.equal(payload.results[1].pointsAwarded,1);
assert.equal(payload.results[0].options[1].label,"π");

const older=await call("?attempt=attempt-old");
assert.equal(older.status,200);
const previous=await older.json();
assert.equal(previous.score,3);
assert(previous.results.every(x=>x.correct),"Earlier attempt's exact stored correctness must be restored");

const guessed=await call("?attempt=another-student-attempt");
assert.equal(guessed.status,404);
currentStudent="other-student";
const foreign=await call();
assert.equal(foreign.status,404,"One student must not read another student's assignment");
currentStudent="student-a";
isAdmin=true;
const adminResponse=await call();
assert.equal(adminResponse.status,200);
assert.equal((await adminResponse.json()).preview,true,"Admin selected-student preview may read saved results");
isAdmin=false;
authorized=false;
const anonymous=await call();
assert.equal(anonymous.status,403);
authorized=true;
assert.equal((await call("","POST")).status,405);
noHistory=true;
assert.equal((await call()).status,404,"Do not expose answers to an unsubmitted test");
noHistory=false;

// Smoke-check the very scripts that the protected portal actually deploys.
const root=new URL("../../",import.meta.url);
const dashboard=readFileSync(new URL("assets/student-dashboard-material-selfchecks.js",root),"utf8");
const modal=readFileSync(new URL("cloudflare-portal/static/assets/student-self-checks-v2.js",root),"utf8");
const portal=readFileSync(new URL("cloudflare-portal/static/student-portal.html",root),"utf8");
const preparation=readFileSync(new URL("cloudflare-portal/scripts/prepare-self-check-v2.mjs",root),"utf8");
new Function(dashboard);
new Function(modal);
assert.match(dashboard,/dashboardLastTestReview/);
assert.match(dashboard,/student:self-check-open-saved-result/);
assert.match(modal,/window\.addEventListener\("student:self-check-open-saved-result"/);
assert.match(modal,/Zobrazit odpovědi/);
assert.match(modal,/Jen chyby/);
assert.match(modal,/openSavedResult/);
assert.match(portal,/student-dashboard-material-selfchecks\.js\?v=20261019-4/);
assert.match(preparation,/student-self-checks-v2\.js\?v=20261019-4/);
assert(dbStatements.every(x=>/^\s*SELECT\b/i.test(x)));
console.log("Stored self-check history passed: own attempts, admin preview, forbidden foreign access, read-only archived results, math answers, and dashboard wiring.");
