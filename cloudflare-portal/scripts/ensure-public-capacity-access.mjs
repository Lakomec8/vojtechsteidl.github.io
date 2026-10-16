const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();

const targets = [
  { name: "Public capacity API", domain: "vojtechsteidl.eu/api/public-capacity" },
  { name: "Public capacity API (www)", domain: "www.vojtechsteidl.eu/api/public-capacity" },
];

if (!apiToken || !accountId) {
  throw new Error("Cloudflare API credentials are unavailable.");
}

async function cloudflare(method, path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const code = payload?.errors?.[0]?.code;
    throw new Error(`Cloudflare API request failed (${response.status}${code ? `, code ${code}` : ""}).`);
  }
  return payload?.result;
}

function normalizedDomain(value) {
  return String(value || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
}

function isEveryoneBypass(policy) {
  return String(policy?.decision || "").toLowerCase() === "bypass"
    && Array.isArray(policy?.include)
    && policy.include.some((rule) => rule && typeof rule === "object" && Object.hasOwn(rule, "everyone"));
}

const scope = `/accounts/${encodeURIComponent(accountId)}/access/apps`;
const applications = await cloudflare("GET", `${scope}?per_page=100`);

for (const target of targets) {
  const existing = (Array.isArray(applications) ? applications : []).find(
    (application) => normalizedDomain(application?.domain) === target.domain,
  );

  if (!existing?.id) {
    const created = await cloudflare("POST", scope, {
      name: target.name,
      type: "self_hosted",
      domain: target.domain,
      session_duration: "24h",
      app_launcher_visible: false,
      policies: [{
        name: "Bypass authentication for public calendar capacity",
        precedence: 1,
        decision: "bypass",
        include: [{ everyone: {} }],
      }],
    });
    console.log(JSON.stringify({ event: "public_capacity_access_created", domain: target.domain, id: created?.id || null }));
    continue;
  }

  const policyPath = `${scope}/${encodeURIComponent(existing.id)}/policies`;
  const policies = await cloudflare("GET", `${policyPath}?per_page=100`);
  if (Array.isArray(policies) && policies.some(isEveryoneBypass)) {
    console.log(JSON.stringify({ event: "public_capacity_access_verified", domain: target.domain, id: existing.id }));
    continue;
  }

  await cloudflare("POST", policyPath, {
    name: "Bypass authentication for public calendar capacity",
    precedence: 1,
    decision: "bypass",
    include: [{ everyone: {} }],
  });
  console.log(JSON.stringify({ event: "public_capacity_access_policy_created", domain: target.domain, id: existing.id }));
}
