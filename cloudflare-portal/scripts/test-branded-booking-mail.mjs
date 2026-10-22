import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync(new URL("../integrations/google-booking-bridge.gs", import.meta.url), "utf8");
assert(!script.includes("MailApp.sendEmail("), "Never send booking emails from the script owner's personal Gmail");
assert(script.includes("RESEND_API_KEY"), "Resend secret property missing");

const props = new Map([["RESEND_API_KEY", "re_fake_secret_for_unit_test"]]);
const sent = [];
const sandbox = {
  PropertiesService: { getScriptProperties() { return { getProperty(key) { return props.get(key) || null; } }; } },
  UrlFetchApp: {
    fetch(url, options) {
      sent.push({url, options});
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({id:"msg-test-001"}) };
    }
  },
  JSON,
  Error,
  String,
};
vm.createContext(sandbox);
vm.runInContext(script,sandbox,{filename:"google-booking-bridge.gs"});
const booking = {
  bookingId:"70f61a32-5532-4ce5-b65d-46f1c12043a0",
  email:"parent@example.invalid"
};

sandbox.sendBrandedBookingEmail_(booking,"confirmed","Potvrzení rezervace","Úvodní diagnostika");
assert.equal(sent.length,1);
assert.equal(sent[0].url,"https://api.resend.com/emails");
const request=JSON.parse(sent[0].options.payload);
assert.equal(request.from,"Vojtěch Steidl <info@vojtechsteidl.eu>");
assert.deepEqual(request.to,["parent@example.invalid"]);
assert.equal(request.reply_to,"info@vojtechsteidl.eu");
assert.equal(sent[0].options.headers["Idempotency-Key"],"tutoring-booking/"+booking.bookingId+"/confirmed");
assert.equal(sent[0].options.headers.Authorization,"Bearer re_fake_secret_for_unit_test");

sandbox.sendBrandedBookingEmail_(booking,"cancelled","Zrušení rezervace","Termín zrušen");
assert.notEqual(sent[0].options.headers["Idempotency-Key"],sent[1].options.headers["Idempotency-Key"]);

props.delete("RESEND_API_KEY");
assert.throws(() => sandbox.sendBrandedBookingEmail_(booking,"confirmed","Subj","Body"), /Resend is not configured/);
assert.equal(sent.length,2,"Missing configuration must not send from personal Gmail");

props.set("RESEND_API_KEY","re_fake_secret_for_unit_test");
sandbox.UrlFetchApp.fetch=()=>({getResponseCode:()=>403,getContentText:()=>JSON.stringify({message:"Unauthorized"})});
assert.throws(() => sandbox.sendBrandedBookingEmail_(booking,"confirmed","Subj","Body"), /Resend request failed with HTTP 403/);

console.log("Branded booking notifications: sender, reply-to, idempotency and fail-closed behavior passed.");
