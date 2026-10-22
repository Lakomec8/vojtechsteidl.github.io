import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(".public-site/index.html", "utf8");
const code = fs.readFileSync("assets/public-capacity.js", "utf8");

assert.match(html, /class="blue-hero-bio" id="o-lektorovi"/, "The tutor's bio belongs on the right side of the compact hero");
assert.match(html, /id="heroBioName">Bc\. Vojtěch Steidl, MBA/, "Tutor credentials must appear in the compact hero");
assert.match(html, /<img src="\/foto.jpg"/, "The tutor's picture should be above the fold");
assert.equal((html.match(/id="o-lektorovi"/g) || []).length, 1, "The tutor bio must not repeat in a separate section");
assert.doesNotMatch(html, /id="contactForm"/, "Remove the duplicate contact/booking form at page bottom");
assert.doesNotMatch(html, /id="kontakt"/, "Do not leave an empty contact section");
assert.equal((html.match(/id="slotBookingForm"/g) || []).length, 1, "Exactly one booking form is allowed");
assert.equal((html.match(/id="bookingStartAt"/g) || []).length, 1);
assert.match(html, /id="bookingTypeSummary"/);
assert.match(html, /class="booking-panel" id="rezervace-terminu"/, "The booking form must be open below the calendar");
assert.doesNotMatch(html, /class="booking-panel booking-inline"/, "The click-only hidden form must be removed");
assert.ok(html.indexOf('id="weeklyCalendar"') < html.indexOf('id="rezervace-terminu"'), "The timetable must precede the form");
assert.match(html, /Rezervace termínu/);
assert.match(html, /Doučování, které má mezi hodinami pokračování/);

class Elem {
  constructor() {
    this.innerHTML = ""; this.textContent = ""; this.value = ""; this.checked = false;
    this.disabled = false; this.dataset = {}; this.events = {}; this.className = "";
    this.classList = { add() {}, remove() {} };
  }
  addEventListener(event, fn) { this.events[event] = fn; }
  querySelector(selector) { return selector.includes("submit") ? this.submit : null; }
  querySelectorAll(selector) { return selector.includes("booking_type") ? this.types : []; }
  reset() { this.value = ""; }
}
const ids = [
  "weeklyCalendar", "calendarWeekLabel", "calendarWeekSummary", "calendarLiveStatus",
  "slotBookingForm", "slotBookingStatus", "bookingStartAt", "bookingTypeSummary"
];
const nodes = Object.fromEntries(ids.map((id) => [id, new Elem()]));
const types = [new Elem(),new Elem()];
types[0].value = "diagnostic_30"; types[0].checked = true;
types[1].value = "lesson_60";
nodes.slotBookingForm.types = types;
nodes.slotBookingForm.submit = new Elem();
nodes.slotBookingForm.submit.textContent = "Potvrdit rezervaci";
const availability = {
  timeZone:"Europe/Prague", calendarSyncedAt:"2026-10-22T12:00:00Z",
  week:{startDate:"2026-10-26",endDate:"2026-10-30"},
  slots:[{day:"Pondělí",time:"16:00–17:00",title:"Matematika – probíhá výuka",kind:"join",people:2,capacity:4}],
  bookingTypes:{diagnostic_30:{duration:30,price:"zdarma"},lesson_60:{duration:60,price:"450 Kč"}},
  availability:{
    diagnostic_30:[{day:"Pondělí",time:"15:00–15:30",startAt:"2026-10-26T14:00:00Z",endAt:"2026-10-26T14:30:00Z"}],
    lesson_60:[{day:"Úterý",time:"17:00–18:00",startAt:"2026-10-27T16:00:00Z",endAt:"2026-10-27T17:00:00Z"}]
  }
};
let postBody = null;
const sandbox = {
  window:{ setInterval() {} },
  document:{getElementById(id){return nodes[id] || null;},addEventListener(){},hidden:false},
  fetch:async (url,options)=>{
    if(url.includes("/api/public-capacity")) return {ok:true,json:async()=>availability};
    if(url.includes("/api/public-bookings")) {
      postBody = JSON.parse(options.body);
      return {ok:true,json:async()=>({
        booking:{startAt:postBody.startAt,label:"Online lekce"},
        confirmationCode:"VS-TEST123",
        bookingId:"70f61a32-5532-4ce5-b65d-46f1c12043a0",
        cancellationToken:"a".repeat(64),
      })};
    }
    throw new Error("Unexpected request " + url);
  },
  FormData:class {get(name){
    return ({
      start_at:nodes.bookingStartAt.value,
      name:"Testovací student",email:"test@example.invalid",grade:"SŠ",
      topic:"Matematika",note:"",website:""
    })[name] ?? "";
  }},
  Date,Intl,Array,Object,String,Math,Number,
};
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:"public-capacity.js"});
await new Promise((resolve)=>setImmediate(resolve));
assert.match(nodes.weeklyCalendar.innerHTML,/Matematika – probíhá výuka/, "Calendar should show occupied lesson");
assert.doesNotMatch(nodes.weeklyCalendar.innerHTML,/data-book-window/, "No alternative click-to-book calendar system");
assert.match(nodes.bookingStartAt.innerHTML,/2026-10-26T14:00:00Z/, "30-minute slots go to the select below calendar");
assert.equal(nodes.bookingStartAt.disabled,false);
types[0].checked=false;types[1].checked=true;
types[1].events.change();
assert.match(nodes.bookingStartAt.innerHTML,/2026-10-27T16:00:00Z/, "Switching duration updates offered slots");
nodes.bookingStartAt.value="2026-10-27T16:00:00Z";
await nodes.slotBookingForm.events.submit({preventDefault(){}});
assert.equal(postBody.bookingType,"lesson_60");
assert.equal(postBody.startAt,"2026-10-27T16:00:00Z");
assert.equal(postBody.email,"test@example.invalid");
assert.match(nodes.slotBookingStatus.innerHTML,/VS-TEST123/);
assert.match(nodes.slotBookingStatus.innerHTML,/sprava-rezervace/);
console.log("Compact tutor hero, calendar-above-booking layout, no bottom duplicate and original backend submission passed.");
