const AUTO_DRAFT_THRESHOLD = 70;
const PUSH_THRESHOLD = 65;
const NTFY_BASE_URL = "https://ntfy.sh";

type DraftCandidate = {
  id: string;
  title: string;
  description: string;
  subject: string;
  score: number;
  is_online: number;
};

type DraftRow = {
  lead_id: string;
  draft_text: string;
  template_key: string;
};

type PushSettings = {
  topic: string;
  started_at: string;
};

type PendingPushLead = {
  id: string;
  subject: string;
  title: string;
  description: string;
  source_url: string;
  score: number;
  draft_text: string | null;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function subjectPhrase(subject: string): string {
  const value = normalize(subject);
  if (value.includes("fyzika") && value.includes("matematika")) return "matematiky a fyziky";
  if (value.includes("fyzika")) return "fyziky";
  return "matematiky";
}

function buildDraft(lead: DraftCandidate): { text: string; templateKey: string } {
  const text = normalize(`${lead.title} ${lead.description}`);
  const mode = lead.is_online ? "online doučování" : "doučování";
  const subject = subjectPhrase(lead.subject);

  let templateKey = "general";
  let focus = "Můžeme se zaměřit přesně na témata, která teď dělají největší problém, a postupně je převést do samostatného řešení úloh.";

  if (/matur/.test(text)) {
    templateKey = "maturita";
    focus = "Při přípravě k maturitě můžeme postupovat cíleně podle problematických okruhů a typových úloh a současně hlídat postup, přesnost i čas.";
  } else if (/prijim|prijimac/.test(text)) {
    templateKey = "prijimacky";
    focus = "U přijímaček můžeme systematicky pracovat s typovými úlohami CERMAT, slabšími okruhy i strategií řešení pod časem.";
  } else if (/\bvs\b|vysok|univerzit|fakult|zapocet|zkousk/.test(text)) {
    templateKey = "university";
    focus = "U vysokoškolské látky můžeme jít i více do principu a odvození, aby řešení nestálo jen na memorování postupů.";
  } else if (/reparat/.test(text)) {
    templateKey = "reparat";
    focus = "U přípravy na reparát bychom nejdřív rychle identifikovali kritická témata a potom šli po úlohách s největším dopadem na výsledek.";
  } else if (/dlouhodob|pravideln|kazd(y|ou)\s+tyden|1x\s*tydn|jednou\s+tydn|cely\s+skolni/.test(text)) {
    templateKey = "long-term";
    focus = "U pravidelné spolupráce můžeme průběžně navazovat na školní výuku, doplňovat mezery a držet stabilní tempo bez nárazového dohánění.";
  }

  const draft = `Dobrý den, rád bych reagoval na Vaši poptávku a nabídl ${mode} ${subject}. Jsem absolvent aplikované fyziky na MUNI a matematiku i fyziku dlouhodobě doučuji. ${focus} Výuku vedu tak, aby student látce skutečně porozuměl a uměl postup samostatně použít, ne jen mechanicky počítal příklady. Pokud je poptávka stále aktuální, rád se domluvím na prvním termínu.\n\nVojtěch`;
  return { text: draft, templateKey };
}

export async function ensureLeadDrafts(env: Env): Promise<number> {
  const candidates = await env.DB.prepare(`SELECT l.id, l.title, l.description, l.subject, l.score, l.is_online
      FROM tutoring_leads l
      LEFT JOIN tutoring_lead_drafts d ON d.lead_id = l.id
     WHERE l.score >= ?1
       AND d.lead_id IS NULL
       AND l.status NOT IN ('ignored', 'lost')
     ORDER BY datetime(l.first_seen_at) DESC
     LIMIT 80`)
    .bind(AUTO_DRAFT_THRESHOLD)
    .all<DraftCandidate>();

  let created = 0;
  for (const lead of candidates.results || []) {
    const draft = buildDraft(lead);
    const result = await env.DB.prepare(`INSERT OR IGNORE INTO tutoring_lead_drafts
      (lead_id, draft_text, template_key, generated_at)
      VALUES (?1, ?2, ?3, ?4)`)
      .bind(lead.id, draft.text, draft.templateKey, new Date().toISOString())
      .run();
    if (Number(result.meta.changes || 0) > 0) created += 1;
  }

  if (created) console.log(JSON.stringify({ event: "lead_drafts_generated", created }));
  return created;
}

async function publish(
  topic: string,
  lead: PendingPushLead,
): Promise<boolean> {
  const hasDraft = Boolean(lead.draft_text);
  const body = [
    `${lead.subject || "Doučování"} · ${lead.score}/100`,
    lead.title,
    lead.description.slice(0, 520),
    hasDraft ? `PŘIPRAVENÁ ODPOVĚĎ:\n${lead.draft_text}` : "",
  ].filter(Boolean).join("\n\n");

  try {
    const response = await fetch(`${NTFY_BASE_URL}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": hasDraft ? `Lead Alert · ${lead.score}/100 · odpověď připravena` : `Lead Alert · ${lead.score}/100`,
        "Priority": lead.score >= 85 ? "high" : "default",
        "Tags": "dart,tutor",
        "Click": lead.source_url,
      },
      body: body.slice(0, 3900),
    });
    return response.ok;
  } catch (error) {
    console.error(JSON.stringify({
      event: "lead_draft_push_error",
      lead_id: lead.id,
      message: error instanceof Error ? error.message : "unknown",
    }));
    return false;
  }
}

export async function runLeadPushWithDrafts(env: Env): Promise<{ sent: number; failed: number }> {
  const settings = await env.DB.prepare(
    "SELECT topic, started_at FROM tutoring_lead_push_settings WHERE id = 1",
  ).first<PushSettings>();
  if (!settings) return { sent: 0, failed: 0 };

  const pending = await env.DB.prepare(`SELECT l.id, l.subject, l.title, l.description, l.source_url, l.score,
                                              d.draft_text
      FROM tutoring_leads l
      LEFT JOIN tutoring_lead_drafts d ON d.lead_id = l.id
     WHERE l.score >= ?1
       AND l.alerted_at IS NULL
       AND l.status NOT IN ('ignored', 'lost')
       AND datetime(l.first_seen_at) >= datetime(?2)
     ORDER BY l.score DESC, datetime(l.first_seen_at) ASC
     LIMIT 20`)
    .bind(PUSH_THRESHOLD, settings.started_at)
    .all<PendingPushLead>();

  let sent = 0;
  let failed = 0;
  for (const lead of pending.results || []) {
    const ok = await publish(settings.topic, lead);
    if (ok) {
      sent += 1;
      await env.DB.prepare("UPDATE tutoring_leads SET alerted_at = ?2 WHERE id = ?1 AND alerted_at IS NULL")
        .bind(lead.id, new Date().toISOString())
        .run();
    } else {
      failed += 1;
    }
  }

  if (sent || failed) console.log(JSON.stringify({ event: "lead_push_with_drafts", sent, failed }));
  return { sent, failed };
}

export async function addLeadDraftsToDashboard(response: Response, env: Env): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (!body.includes('data-lead-id="')) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const rows = await env.DB.prepare(`SELECT d.lead_id, d.draft_text, d.template_key
      FROM tutoring_lead_drafts d
      JOIN tutoring_leads l ON l.id = d.lead_id
     ORDER BY datetime(l.first_seen_at) DESC
     LIMIT 120`).all<DraftRow>();
  const drafts = new Map((rows.results || []).map((row) => [row.lead_id, row]));
  if (!drafts.size) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  let updated = body.replace(
    /<article class="lead-card([^"]*)" data-lead-id="([^"]+)">([\s\S]*?)<\/article>/g,
    (full, classes: string, id: string, inner: string) => {
      const draft = drafts.get(id);
      if (!draft) return full;
      const panel = `<div class="lead-draft"><div class="lead-draft-head"><strong>Připravená odpověď</strong><span>Auto-draft · ${esc(draft.template_key)} · score ≥ ${AUTO_DRAFT_THRESHOLD}</span></div><div class="lead-draft-text">${esc(draft.draft_text)}</div><button class="button copy-draft" type="button" data-copy-draft>Kopírovat odpověď</button></div>`;
      const withPanel = inner.includes('<div class="lead-footer">')
        ? inner.replace('<div class="lead-footer">', `${panel}<div class="lead-footer">`)
        : `${inner}${panel}`;
      return `<article class="lead-card${classes}" data-lead-id="${esc(id)}">${withPanel}</article>`;
    },
  );

  updated = updated.replace(
    "</style>",
    `.lead-draft{margin-top:12px;padding:12px 13px;border:1px solid #c8ddd3;border-radius:14px;background:#eef8f3}.lead-draft-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:7px}.lead-draft-head strong{font-size:11px;color:#2f7258}.lead-draft-head span{font-size:9px;color:#6d756f}.lead-draft-text{white-space:pre-wrap;font-size:11px;line-height:1.55;color:#424940}.copy-draft{margin-top:9px;box-shadow:none;background:#fff}.copy-draft.copied{background:#dff7ed;border-color:#83dcb9}@media(max-width:620px){.lead-draft-head{align-items:flex-start;flex-direction:column}}</style>`,
  );

  updated = updated.replace(
    "</body>",
    `<script>document.querySelectorAll('[data-copy-draft]').forEach(button=>button.addEventListener('click',async()=>{const panel=button.closest('.lead-draft');const text=panel?.querySelector('.lead-draft-text')?.textContent||'';if(!text)return;const original=button.textContent;try{await navigator.clipboard.writeText(text);button.textContent='Zkopírováno';button.classList.add('copied');setTimeout(()=>{button.textContent=original;button.classList.remove('copied')},1600)}catch{button.textContent='Kopírování selhalo'}}));</script></body>`,
  );

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}
