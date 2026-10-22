
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(".public-site/index.html", "utf8");
const client = fs.readFileSync("assets/public-capacity.js", "utf8");
assert.match(html,/class="booking-panel booking-inline" id="rezervace-terminu" hidden/);
assert.match(html,/id="weeklyCalendar"/);
assert.match(html,/id="slotBookingForm"/);
assert.doesNotMatch(html,/Rezervace ve třech krocích/);
assert.equal((html.match(/id="slotBookingForm"/g)||[]).length, 1, "Exactly one booking form");
assert.equal((html.match(/id="bookingStartAt"/g)||[]).length, 1, "Exactly one time selector");
assert.match(html,/calendar-booking-type/);
assert.match(html,/calendar-window/);

class ElementMock {
  constructor() {
    this.innerHTML = ""; this.textContent = ""; this.value = ""; this.checked = false;
    this.disabled = false; this.hidden = false; this.dataset = {};
    this.events = {}; this.classes = new Set();
    this.classList = {
      add: (...values) => values.forEach((v) => this.classes.add(v)),
      remove: (...values) => values.forEach((v) => this.classes.delete(v)),
      contains: (v) => this.classes.has(v),
      toggle: (v, state) => state ? this.classes.add(v) : this.classes.delete(v),
    };
  }
  addEventListener(name, fn) { this.events[name] = fn; }
  querySelectorAll() { return []; }
  querySelector() { return this.submitButton || null; }
  scrollIntoView() {}
  closest(selector) { return selector === "[data-book-window]" ? this : null; }
  reset() {}
}
const elementIds = ["weeklyCalendar","calendarWeekLabel","calendarWeekSummary","calendarLiveStatus",
  "slotBookingForm","slotBookingStatus","bookingStartAt","rezervace-terminu",
  "bookingSelectedTitle","bookingSelectedMeta","bookingDismiss","calendarActionStatus"];
const nodes = Object.fromEntries(elementIds.map((id) => [id,new ElementMock()]));
nodes["rezervace-terminu"].hidden = true;
nodes["slotBookingForm"].submitButton = new ElementMock();
nodes["slotBookingForm"].submitButton.textContent = "Potvrdit rezervaci";
const types = [new ElementMock(),new ElementMock()];
types[0].value = "diagnostic_30"; types[0].checked = true; types[1].value = "lesson_60";
const response = {
  timeZone:"Europe/Prague",
  calendarSyncedAt:"2026-10-22T12:00:00Z",
  week:{startDate:"2026-10-26",endDate:"2026-10-30"},
  slots:[{day:"Pondělí",time:"16:00–17:00",title:"Matematika - probíhající hodina",kind:"join",people:2,capacity:4}],
  availability: {
    diagnostic_30:[
      {day:"Pondělí",time:"15:00–15:30",startAt:"2026-10-26T14:00:00Z",endAt:"2026-10-26T14:30:00Z"},
      {day:"Pondělí",time:"15:15–15:45",startAt:"2026-10-26T14:15:00Z",endAt:"2026-10-26T14:45:00Z"},
      {day:"Úterý",time:"17:00–17:30",startAt:"2026-10-27T16:00:00Z",endAt:"2026-10-27T16:30:00Z"}
    ],
    lesson_60:[
      {day:"Pondělí",time:"15:00–16:00",startAt:"2026-10-26T14:00:00Z",endAt:"2026-10-26T15:00:00Z"}
    ]
  }
};
let capturedBooking = null;
let fetchCalls = 0;
const sandbox = {
  Element:ElementMock, Date, Intl, Number, String, Array, Object, Math,
  window:{setInterval(){},matchMedia(){return {matches:true}}},
  document:{
    getElementById(id){return nodes[id] || null},
    querySelectorAll(selector){return selector.includes("booking_type") ? types : []},
    addEventListener(){}, hidden:false
  },
  fetch:async (url,options)=>{
    fetchCalls++;
    if(url.includes("/api/public-capacity")) return {ok:true,json:async()=>response};
    if(url.includes("/api/public-bookings")){
      capturedBooking = JSON.parse(options.body);
      return {ok:true,json:async()=>({
        booking:{startAt:capturedBooking.startAt,label:"Úvodní online diagnostika"},
        confirmationCode:"VS-TEST123",bookingId:"70f61a32-5532-4ce5-b65d-46f1c12043a0",
        cancellationToken:"a".repeat(64)
      })};
    }
    throw new Error("Unexpected request " + url);
  },
  FormData:class {constructor(){} get(name){
    return ({start_at:nodes.bookingStartAt.value,name:"Test",email:"test@example.invalid",
      grade:"SŠ",topic:"Limity",note:"",website:""})[name] ?? "";
  }},
};
vm.createContext(sandbox);
vm.runInContext(client,sandbox,{filename:"public-capacity.js"});
await new Promise((resolve)=>setImmediate(resolve));
const calendar=nodes.weeklyCalendar;
assert.match(calendar.innerHTML,/calendar-window/,"No bookable green spots rendered");
assert.equal((calendar.innerHTML.match(/data-book-window="/g)||[]).length,2,
  "Adjacent 15-min start times must combine into one calendar window");
assert.match(calendar.innerHTML,/Matematika/);
const choose=new ElementMock(); choose.dataset.bookWindow="0";
calendar.events.click({target:choose});
assert.equal(nodes["rezervace-terminu"].hidden,false,"Booking form must open on calendar selection");
assert.equal(nodes.bookingStartAt.disabled,false);
assert.equal(nodes.bookingStartAt.value,"2026-10-26T14:00:00Z");
assert.equal((nodes.bookingStartAt.innerHTML.match(/<option /g)||[]).length,2,"Both start times must be available in selected window");
types[0].checked=false; types[1].checked=true;
types[1].events.change();
assert.equal(nodes["rezervace-terminu"].hidden,true,"Changing duration must reset stale selection");
assert.equal((calendar.innerHTML.match(/data-book-window="/g)||[]).length,1);
calendar.events.click({target:choose});
assert.equal(nodes.bookingStartAt.value,"2026-10-26T14:00:00Z");
await nodes["slotBookingForm"].events.submit({preventDefault(){}});
assert.equal(capturedBooking.bookingType,"lesson_60");
assert.equal(capturedBooking.startAt,"2026-10-26T14:00:00Z");
assert.equal(nodes["rezervace-terminu"].classes.has("is-complete"),true);
assert.match(nodes.slotBookingStatus.innerHTML,/VS-TEST123/);
assert.ok(fetchCalls>=3);
console.log("Unified calendar booking: selection, merged windows, duration switch, submit and success state passed.");
