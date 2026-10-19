import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/self-checks.ts", import.meta.url), "utf8");
const converted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
});
const questionData = [
  {id:"q1",position:1,prompt:"Úloha 1",options_json:JSON.stringify([{id:"a",label:"Ano"},{id:"b",label:"Ne"}]),correct_answer:"a",explanation:"A",points:1},
  {id:"q2",position:2,prompt:"Úloha 2",options_json:JSON.stringify([{id:"a",label:"Ano"},{id:"b",label:"Ne"}]),correct_answer:"a",explanation:"B",points:3},
  {id:"q3",position:3,prompt:"Úloha 3",options_json:JSON.stringify([{id:"a",label:"Ano"},{id:"b",label:"Ne"}]),correct_answer:"a",explanation:"C",points:2},
];
const dbBatches=[];
const env={DB:{
  prepare(sql){
    return {bind(...params){
      if(/^INSERT/i.test(sql.trim()))return {sql,params};
      return {
        async first(){
          assert.match(sql,/FROM self_check_assignments a/);
          assert.equal(params[0],"assigned");
          assert.equal(params[1],"student-1");
          return {id:"assigned",test_id:"test-1",title:"Test",topic:"Fyzika",question_count:3,
            max_score:6,assignment_status:"active",test_status:"published",available:1};
        },
        async all(){
          if(sql.includes("FROM self_check_questions") && !sql.includes("LEFT JOIN"))return {results:questionData};
          throw Error("Unexpected SQL "+sql.slice(0,100));
        }
      };
    }};
  },
  async batch(stmts){dbBatches.push(stmts);return stmts.map(()=>({success:true}));}
}};
class PortalError extends Error{constructor(status,msg){super(msg);this.status=status;}}
let admin=false,studentId="student-1";
const modules={
  "./entry":{
    PortalError,
    async principalForRequest(){return {student:admin?null:{id:studentId},isAdmin:admin};},
    async selectedStudentForPrincipal(){return {id:studentId,display_name:"Student"};},
    privateHeaders(){return new Headers({"Cache-Control":"private, no-store"});}
  },
  "./student-learning":{async selfCheckSummaryForStudent(){return {completedTests:0,averagePercent:null,latest:null};}},
  "./admin-self-check-results":{adminSelfCheckResults(){throw Error("not called");}}
};
const exports={};
new Function("require","exports",converted.outputText)((name)=>modules[name],exports);
const handle=exports.handleSelfCheckRoute;
const post=async(body)=> {
  const response=await handle(new Request("https://vojtechsteidl.eu/student-portal/api/self-checks/assigned/submit",{
    method:"POST",headers:{"Content-Type":"application/json","Origin":"https://vojtechsteidl.eu"},
    body:JSON.stringify(body)
  }),env);
  return {status:response.status,body:await response.json()};
};
let result=await post({partial:true,answers:{q1:"a",q2:"b"}});
assert.equal(result.status,200);
assert.equal(result.body.isPartial,true);
assert.equal(result.body.answeredCount,2);
assert.equal(result.body.totalQuestions,3);
assert.equal(result.body.fullMaxScore,6);
assert.equal(result.body.maxScore,4);
assert.equal(result.body.score,1);
assert.equal(result.body.percent,25);
assert.equal(result.body.coveragePercent,67);
assert.equal(result.body.results.length,2);
assert.equal(dbBatches.length,1);
assert.equal(dbBatches[0].length,3,"Partial attempt stores only answered questions");
assert.match(dbBatches[0][0].sql,/is_partial, answered_count, total_questions, full_max_score/);
assert.deepEqual(dbBatches[0][0].params.slice(-4),[1,2,3,6]);
assert.equal(dbBatches[0][1].params[1],"q1");
assert.equal(dbBatches[0][2].params[1],"q2");

result=await post({partial:true,answers:{q3:"b"}});
assert.equal(result.status,200);
assert.equal(result.body.percent,0);
assert.equal(result.body.maxScore,2);
assert.equal(result.body.answeredCount,1);
assert.equal(dbBatches[1].length,2);

result=await post({answers:{q1:"a",q2:"b",q3:"a"}});
assert.equal(result.status,200);
assert.equal(result.body.isPartial,false);
assert.equal(result.body.score,3);
assert.equal(result.body.maxScore,6);
assert.equal(result.body.percent,50);
assert.equal(dbBatches[2].length,4);
assert.deepEqual(dbBatches[2][0].params.slice(-4),[0,3,3,6]);

result=await post({partial:true,answers:{q1:"a",q2:"b",q3:"a"}});
assert.equal(result.status,200);
assert.equal(result.body.isPartial,false,"All answers count as a finished test");
assert.equal(result.body.maxScore,6);

for(const body of [
  {partial:true,answers:{}},
  {answers:{q1:"a",q2:"a"}},
  {partial:true,answers:{q1:"a",unknown:"a"}},
  {partial:"true",answers:{q1:"a"}},
  {partial:true,answers:{q1:"not-an-option"}},
  {partial:true,answers:{q1:"a",q2:"a",q3:"a",unknown:"a"}},
]){
  const before=dbBatches.length;
  const r=await post(body);
  assert.equal(r.status,400,"Server must reject incomplete/unrecognized malformed submissions");
  assert.equal(before,dbBatches.length,"Invalid results must never write database rows");
}

admin=true;
const before=dbBatches.length;
result=await post({partial:true,answers:{q1:"a"}});
assert.equal(result.status,200);
assert.equal(result.body.preview,true);
assert.equal(result.body.percent,100);
assert.equal(dbBatches.length,before,"Admin preview must never persist a result");
admin=false;

console.log("Partial self-checks passed: weighted answered-only percentage, coverage, incomplete persistence, all-complete fallback, malformed inputs, and read-only admin preview.");
