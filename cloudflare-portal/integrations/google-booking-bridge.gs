/**
 * Google Apps Script webhook for Cloudflare public-booking outbox.
 *
 * Script Properties (Google Apps Script > Project Settings > Script Properties):
 *   BOOKING_WEBHOOK_SECRET = a newly generated random 32+ character secret
 *   BOOKING_CALENDAR_ID = "primary" or the exact calendar ID to populate
 *   RESEND_API_KEY = a Resend API key with Sending access, stored ONLY in Script Properties
 *   Verified Resend domain: vojtechsteidl.eu (sender: info@vojtechsteidl.eu)
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
  var cal = id === "primary" ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
  if (!cal) throw new Error("Calendar not accessible");
  return cal;
}
function lessonName_(data) {
  return data.type === "diagnostic_30" ? "Úvodní diagnostika – " + data.name : "Doučování – " + data.name;
}
function formatDate_(iso) {
  return Utilities.formatDate(new Date(iso), "Europe/Prague", "d. M. yyyy HH:mm");
}
/**
 * Send transactional notifications from the verified tutoring domain.
 * No fallback to MailApp: a failure must NEVER expose the script owner's
 * personal Gmail address to a customer.
 *
 * Stable phase-specific keys make retries idempotent for 24 hours at Resend.
 * The existing Script Properties record provides long-term deduplication.
 */
function sendBrandedBookingEmail_(booking, phase, subject, body) {
  var key = PropertiesService.getScriptProperties().getProperty("RESEND_API_KEY");
  if (!key || key.indexOf("re_") !== 0) {
    throw new Error("Resend is not configured");
  }
  if (!booking || !/^[0-9a-f-]{36}$/.test(String(booking.bookingId || ""))) {
    throw new Error("Invalid booking");
  }
  var payload = {
    from: "Vojtěch Steidl <info@vojtechsteidl.eu>",
    to: [String(booking.email || "")],
    reply_to: "info@vojtechsteidl.eu",
    subject: subject,
    text: body
  };
  var response = UrlFetchApp.fetch("https://api.resend.com/emails", {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + key,
      "Idempotency-Key": "tutoring-booking/" + booking.bookingId + "/" + phase
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    // Do not log API keys, message contents, customer addresses or response bodies.
    throw new Error("Resend request failed with HTTP " + code);
  }
  var result = JSON.parse(response.getContentText() || "{}");
  if (!result.id) throw new Error("Resend response did not include a message ID");
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

        sendBrandedBookingEmail_(
          data, "confirmed",
          "Potvrzení rezervace " + data.code + " – Vojtěch Steidl",
          "Dobrý den,\n\nvaše rezervace doučování je potvrzena.\n" +
            lessonName_(data) + "\nTermín: " + formatDate_(data.startAt) +
            " (Praha)\nKód rezervace: " + data.code +
            "\n\nZrušení alespoň 24 hodin předem je zdarma. " +
            "Pro změny odpovězte na tento e-mail nebo pište na info@vojtechsteidl.eu." +
            "\n\nVojtěch Steidl\nhttps://vojtechsteidl.eu/"
        );
        props.setProperty(mailKey,"sent");
      }
      return json_({ok:true,eventId:eventId || ""});
    }
    if (!props.getProperty(cancelKey)) {
      if (event) event.deleteEvent();
      props.setProperty(cancelKey,"cancelled");
    }
    if (props.getProperty(mailKey) && props.getProperty(mailKey) !== "cancelled") {

      sendBrandedBookingEmail_(
        data, "cancelled",
        "Zrušení rezervace " + data.code + " – Vojtěch Steidl",
        "Dobrý den,\n\nrezervace " + data.code + " na " +
          formatDate_(data.startAt) + " byla zrušena.\n" +
          "Nový termín si můžete vybrat na https://vojtechsteidl.eu/#kapacita." +
          "\n\nVojtěch Steidl"
      );
      props.setProperty(mailKey,"cancelled");
    }
    return json_({ok:true,eventId:eventId || ""});
  } catch (err) {
    return json_({ok:false,error:"integration_failed"});
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}
