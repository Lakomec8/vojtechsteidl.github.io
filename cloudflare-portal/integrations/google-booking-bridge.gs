/**
 * Google Apps Script webhook for Cloudflare public-booking outbox.
 *
 * Script Properties (Google Apps Script > Project Settings > Script Properties):
 *   BOOKING_WEBHOOK_SECRET = a newly generated random 32+ character secret
 *   BOOKING_CALENDAR_ID = "primary" or the exact calendar ID to populate
 *
 * Deploy > New deployment > Web app:
 *   Execute as: Me; Who has access: Anyone
 *   Copy the /exec URL into both Cloudflare Worker secrets:
 *     GOOGLE_BOOKING_WEBHOOK_URL
 *     GOOGLE_BOOKING_WEBHOOK_SECRET
 *
 * The secret must be the same in Cloudflare and Script Properties.
 * This source file deliberately contains NO secret.
 */
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function calendar_() {
  var id = PropertiesService.getScriptProperties().getProperty("BOOKING_CALENDAR_ID") || "primary";
  var cal = CalendarApp.getCalendarById(id);
  if (!cal) throw new Error("Calendar not accessible");
  return cal;
}
function lessonName_(data) {
  return data.type === "diagnostic_30" ? "Úvodní diagnostika – " + data.name : "Doučování – " + data.name;
}
function formatDate_(iso) {
  return Utilities.formatDate(new Date(iso), "Europe/Prague", "d. M. yyyy HH:mm");
}
function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var expected = props.getProperty("BOOKING_WEBHOOK_SECRET");
  var lock = LockService.getScriptLock();
  try {
    if (!expected || expected.length < 32) return json_({ok:false,error:"unconfigured"});
    var data = JSON.parse(e.postData.contents || "{}");
    if (!data.secret || data.secret !== expected) return json_({ok:false,error:"unauthorized"});
    if (!/^[0-9a-f-]{36}$/.test(String(data.bookingId || ""))) return json_({ok:false,error:"bad_id"});
    if (data.action !== "create" && data.action !== "cancel") return json_({ok:false,error:"bad_action"});
    if (!lock.tryLock(25000)) return json_({ok:false,error:"busy"});
    var cal = calendar_();
    var eventKey = "booking_event_" + data.bookingId;
    var mailKey = "booking_mail_" + data.bookingId;
    var cancelKey = "booking_cancel_" + data.bookingId;
    var eventId = props.getProperty(eventKey);
    var event = null;
    if (eventId) {
      try { event = cal.getEventById(eventId); } catch (ignored) {}
    }
    if (data.action === "create") {
      var start = new Date(data.startAt);
      var end = new Date(data.endAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return json_({ok:false,error:"bad_time"});
      }
      if (!event && !props.getProperty(cancelKey)) {
        event = cal.createEvent(
          lessonName_(data), start, end,
          {description: "Rezervace z vojtechsteidl.eu\nKód: " + data.code +
            "\nE-mail: " + data.email + "\nRočník: " + data.grade +
            "\nTéma: " + data.topic + "\nPoznámka: " + (data.note || "")}
        );
        eventId = event.getId();
        props.setProperty(eventKey, eventId);
      }
      if (!props.getProperty(mailKey)) {
        MailApp.sendEmail({
          to:data.email, replyTo:"info@vojtechsteidl.eu",
          subject:"Potvrzení rezervace " + data.code + " – Vojtěch Steidl",
          body:"Dobrý den,\n\nvaše rezervace doučování je potvrzena.\n" +
            lessonName_(data) + "\nTermín: " + formatDate_(data.startAt) +
            " (Praha)\nKód rezervace: " + data.code +
            "\n\nZrušení alespoň 24 hodin předem je zdarma. " +
            "Pro změny odpovězte na tento e-mail nebo pište na info@vojtechsteidl.eu." +
            "\n\nVojtěch Steidl\nhttps://vojtechsteidl.eu/"
        });
        props.setProperty(mailKey,"sent");
      }
      return json_({ok:true,eventId:eventId || ""});
    }
    if (!props.getProperty(cancelKey)) {
      if (event) event.deleteEvent();
      props.setProperty(cancelKey,"cancelled");
    }
    if (props.getProperty(mailKey) && props.getProperty(mailKey) !== "cancelled") {
      MailApp.sendEmail({
        to:data.email, replyTo:"info@vojtechsteidl.eu",
        subject:"Zrušení rezervace " + data.code + " – Vojtěch Steidl",
        body:"Dobrý den,\n\nrezervace " + data.code + " na " +
          formatDate_(data.startAt) + " byla zrušena.\n" +
          "Nový termín si můžete vybrat na https://vojtechsteidl.eu/#kapacita." +
          "\n\nVojtěch Steidl"
      });
      props.setProperty(mailKey,"cancelled");
    }
    return json_({ok:true,eventId:eventId || ""});
  } catch (err) {
    return json_({ok:false,error:"integration_failed"});
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}
