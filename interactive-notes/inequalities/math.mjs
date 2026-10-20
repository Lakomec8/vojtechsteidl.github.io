// Pure mathematical model shared by the lesson and regression tests.
// All interval endpoints are exact numbers or infinities; finite endpoints retain inclusivity.
const EPS=1e-9;
const eq=(a,b)=>Math.abs(a-b)<EPS;
const cmp=(a,b)=>a===b?0:a===Infinity?1:b===Infinity?-1:a===-Infinity?-1:b===-Infinity?1:eq(a,b)?0:a<b?-1:1;
export const interval=(lo,hi,li=false,ri=false)=>{
  if(!Number.isFinite(lo))li=false;
  if(!Number.isFinite(hi))ri=false;
  if(cmp(lo,hi)>0 || (cmp(lo,hi)===0 && !(li&&ri)))return null;
  return {lo,hi,li,ri};
};
export const point=x=>interval(x,x,true,true);
export function intersection(A,B){
  if(!A||!B)return null;
  const lower=cmp(A.lo,B.lo),upper=cmp(A.hi,B.hi);
  return interval(lower>=0?A.lo:B.lo,upper<=0?A.hi:B.hi,
    lower===0?A.li&&B.li:lower>0?A.li:B.li,
    upper===0?A.ri&&B.ri:upper<0?A.ri:B.ri);
}
const ordered=(A,B)=>cmp(A.lo,B.lo)||Number(B.li)-Number(A.li)||cmp(A.hi,B.hi);
export function union(parts){
 const src=parts.filter(Boolean).sort(ordered);
 const out=[];
 for(const v of src){
  if(!out.length){out.push({...v});continue;}
  const last=out[out.length-1],touch=cmp(last.hi,v.lo);
  if(touch>0 || (touch===0&&(last.ri||v.li))){
   const cmpHi=cmp(last.hi,v.hi);
   if(cmpHi<0){last.hi=v.hi;last.ri=v.ri;}
   else if(cmpHi===0)last.ri=last.ri||v.ri;
  }else out.push({...v});
 }
 return out;
}
export const endpoint=(x)=>x===-Infinity?"−∞":x===Infinity?"+∞":Number(eq(x,0)?0:x).toLocaleString("cs-CZ",{maximumFractionDigits:3});
export function notation(parts){
 const sets=union(parts);
 if(!sets.length)return "∅";
 if(sets.length===1 && sets[0].lo===-Infinity && sets[0].hi===Infinity)return "ℝ";
 return sets.map(({lo,hi,li,ri})=>
  cmp(lo,hi)===0?"{"+endpoint(lo)+"}":
  (li?"⟨":"(")+endpoint(lo)+"; "+endpoint(hi)+(ri?"⟩":")")
 ).join(" ∪ ");
}
export function member(x,A){return Boolean(A)&&(cmp(x,A.lo)>0||(cmp(x,A.lo)===0&&A.li))&&(cmp(x,A.hi)<0||(cmp(x,A.hi)===0&&A.ri));}
export function belongs(x,parts){return parts.some(p=>member(x,p));}
const ineq=(v,op)=>op===">"?v>EPS:op==="<"?v<-EPS:op==="≥"?v>=-EPS:v<=EPS;
export const relation=ineq;
function unique(points){return [...points].sort((x,y)=>x-y).filter((v,i,a)=>i===0||!eq(v,a[i-1]));}
function sample(lo,hi){
 if(lo===-Infinity&&hi===Infinity)return 0;
 if(lo===-Infinity)return hi-Math.max(2,Math.abs(hi)+1);
 if(hi===Infinity)return lo+Math.max(2,Math.abs(lo)+1);
 return (lo+hi)/2;
}
export function signRegions(fn,roots,poles,operator){
 const cuts=unique([...roots,...poles]),boundaries=[-Infinity,...cuts,Infinity],regions=[];
 for(let i=0;i<boundaries.length-1;i++){
  const lo=boundaries[i],hi=boundaries[i+1],s=sample(lo,hi);
  if(ineq(fn(s),operator))regions.push(interval(lo,hi,false,false));
 }
 if(operator==="≥"||operator==="≤"){
  for(const x of unique(roots))if(!poles.some(p=>eq(p,x))&&Math.abs(fn(x))<EPS)regions.push(point(x));
 }
 return union(regions);
}
export function linear(a,b,operator){
 if(Math.abs(a)<EPS)throw Error("Linear coefficient must be nonzero");
 const root=-b/a;
 return{root,parts:signRegions(x=>a*x+b,[root],[],operator)};
}
export function quadratic(a,r1,r2,operator){
 if(Math.abs(a)<EPS)throw Error("Quadratic coefficient must be nonzero");
 const fn=x=>a*(x-r1)*(x-r2);
 return{roots:unique([r1,r2]),parts:signRegions(fn,[r1,r2],[],operator)};
}
export function rational(u,v,operator){
 const same=eq(u,v);
 const fn=x=>same?1:(x-u)/(x-v);
 return{zero:same?null:u,pole:v,parts:signRegions(fn,same?[]:[u],[v],operator)};
}
export function system(A,B){
 const c=intersection(A,B);
 return{parts:c?[c]:[],union:union([A,B])};
}
export function intervalFromBounds(lo,hi,leftClosed,rightClosed){
 return interval(lo,hi,Boolean(leftClosed),Boolean(rightClosed));
}
