import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { dispatchBookingIntegrations } from "../src/booking-delivery.ts";
import { handlePublicBookingCancellation } from "../src/public-capacity.ts";

const status = {
  id:"8c91dad9-3912-4ccd-b2fd-cd6a99d4ba12",
  confirmation_code:"VS-DEMO1",booking_type:"diagnostic_30",
  starts_at:"2026-11-02T16:00:00.000Z",ends_at:"2026-11-02T16:30:00.000Z",
  name:"Testovací zákazník",email:"student@example.com",grade:"SŠ",topic:"Rovnice",note:"",
  status:"confirmed",owner_create_state:"pending",google_create_state:"pending",
  owner_cancel_state:"pending",google_cancel_state:"pending",google_event_id:null,
};
let notifications = 0, calendarCalls = 0, shouldFailOwner = false;
const db = {
  prepare(sql) {
    return {bind(...args) {
      return {
        async first() {
          if(sql.includes("cancellation_token_hash")) return null;
          return {...status};
        },
        async run() {
          if(sql.includes("SET ") && sql.includes(" = 'sending'")) {
            const key = /SET (\w+) = 'sending'/.exec(sql)?.[1];
            if(!key || status[key] === "sent" || status[key] === "sending") return {meta:{changes:0}};
            status[key] = "sending"; return {meta:{changes:1}};
          }
          if(sql.includes("SET ") && sql.includes(" = ?2")) {
            const key = /SET (\w+) = \?2/.exec(sql)?.[1];
            status[key] = args[1];
            if(args[2]) status.google_event_id = args[2];
            return {meta:{changes:1}};
          }
          throw new Error("Unexpected D1 run SQL");
        }
      };
    }};
  }
};
const env={
 DB:db,
 BOOKING_EMAIL:{ async send(message){
   if(shouldFailOwner){ shouldFailOwner=false; throw new Error("mock failure"); }
   assert.equal(message.to,"vojtasteidl@seznam.cz");
   assert.match(message.subject,/VS-DEMO1/);
   notifications++;return {messageId:String(notifications)};
 }},
 GOOGLE_BOOKING_WEBHOOK_URL:"https://script.google.com/macros/s/test/exec",
 GOOGLE_BOOKING_WEBHOOK_SECRET:"secure-example-12345678901234567890123"
};
const fetchBefore=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 assert.match(url,/script\.google\.com/);
 const data=JSON.parse(options.body);
 assert.equal(data.bookingId,status.id);
 assert.equal(data.secret,env.GOOGLE_BOOKING_WEBHOOK_SECRET);
 calendarCalls++;
 return {ok:true,async json(){return {ok:true,eventId:"event-google-123"};}};
};
try {
 shouldFailOwner=true;
 await dispatchBookingIntegrations(env,status.id);
 assert.equal(status.owner_create_state,"retry");
 assert.equal(status.google_create_state,"sent");
 await dispatchBookingIntegrations(env,status.id);
 assert.equal(status.owner_create_state,"sent");
 assert.equal(notifications,1);
 assert.equal(calendarCalls,1);
 await dispatchBookingIntegrations(env,status.id);
 assert.equal(notifications,1,"duplicate booking notification");
 assert.equal(calendarCalls,1,"duplicate Google Calendar create");
 status.status="cancelled";
 await dispatchBookingIntegrations(env,status.id);
 assert.equal(status.owner_cancel_state,"sent");
 assert.equal(status.google_cancel_state,"sent");
 assert.equal(notifications,2);
 assert.equal(calendarCalls,2);
 await dispatchBookingIntegrations(env,status.id);
 assert.equal(notifications,2,"duplicate cancellation notification");
 assert.equal(calendarCalls,2,"duplicate Google Calendar cancellation");
 const rejected=await handlePublicBookingCancellation(
   new Request("https://capacity.vojtechsteidl.eu/api/public-bookings/cancel",
    {method:"POST",headers:{Origin:"https://attacker.example.com"}}),env);
 assert.equal(rejected.status,403,"Cross-site cancellation was allowed");
 const preflight=await handlePublicBookingCancellation(
   new Request("https://capacity.vojtechsteidl.eu/api/public-bookings/cancel",
    {method:"OPTIONS",headers:{Origin:"https://vojtechsteidl.eu"}}),env);
 assert.equal(preflight.status,204);
} finally {
 globalThis.fetch=fetchBefore;
}
const bridge=readFileSync(new URL("../integrations/google-booking-bridge.gs",import.meta.url),"utf8");
new vm.Script(bridge,{filename:"google-booking-bridge.gs"});
const migration=readFileSync(new URL("../migrations/0071_public_booking_dispatch.sql",import.meta.url),"utf8");
assert.match(migration,/cancellation_token_hash/);
assert.match(migration,/owner_create_state/);
console.log("Booking outbox retries, deduplication, CORS, migration and calendar bridge syntax passed.");
