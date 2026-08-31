import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
const policyAud = String(process.env.PORTAL_POLICY_AUD || "").trim();

function runD1(sql) {
  const stdout = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "d1", "execute", "DB", "--remote", "--json", "--command", sql],
    {
      cwd: appRoot,
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout);
}

function resultRows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) return batch.results;
    if (Array.isArray(batch?.result?.results)) return batch.result.results;
    if (Array.isArray(batch?.result)) {
      for (const nested of batch.result) {
        if (Array.isArray(nested?.results)) return nested.results;
      }
    }
  }
  return [];
}

async function cloudflare(path, { optional = false } = {}) {
  if (!apiToken || !accountId) {
    if (optional) return null;
    throw new Error("Cloudflare API credentials are unavailable.");
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    if (optional && [401, 403].includes(response.status)) return null;
    const code = payload?.errors?.[0]?.code;
    throw new Error(`Cloudflare API request failed (${response.status}${code ? `, code ${code}` : ""}).`);
  }
  return payload?.result;
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function ruleDetails(rule) {
  if (!rule || typeof rule !== "object") return { kind: "unknown" };
  if (Object.hasOwn(rule, "everyone")) return { kind: "everyone" };
  if (rule.email) {
    const email = normalizedEmail(rule.email.email || rule.email.address || rule.email);
    return email ? { kind: "email", value: email } : { kind: "unknown" };
  }
  if (rule.email_domain) {
    const domain = normalizedEmail(rule.email_domain.domain || rule.email_domain);
    return domain ? { kind: "domain", value: domain.replace(/^@/, "") } : { kind: "unknown" };
  }
  return { kind: "complex" };
}

function matchesRule(email, detail) {
  if (detail.kind === "everyone") return true;
  if (detail.kind === "email") return email === detail.value;
  if (detail.kind === "domain") return email.endsWith(`@${detail.value}`);
  return false;
}

function policyCoverage(email, policies) {
  let unknown = false;
  for (const policy of policies) {
    if (String(policy?.decision || "").toLowerCase() !== "allow") continue;
    const includes = (Array.isArray(policy?.include) ? policy.include : []).map(ruleDetails);
    const excludes = (Array.isArray(policy?.exclude) ? policy.exclude : []).map(ruleDetails);
    const requires = Array.isArray(policy?.require) ? policy.require : [];
    if (excludes.some((rule) => matchesRule(email, rule))) continue;
    if (includes.some((rule) => matchesRule(email, rule)) && requires.length === 0) return "allowed";
    if (includes.some((rule) => ["complex", "unknown"].includes(rule.kind)) || requires.length > 0) {
      unknown = true;
    }
  }
  return unknown ? "unknown" : "missing";
}

function safeIdentity(row, policyStatus, latestAuth) {
  return {
    kind: row.kind,
    id: row.kind === "admin" ? "administrator" : row.ref_id,
    displayName: row.display_name,
    enabled: Number(row.enabled) === 1,
    hasEmail: Boolean(normalizedEmail(row.email)),
    hasProfile: row.kind === "admin" ? true : Number(row.has_profile) === 1,
    lastPortalVisit: row.last_portal_visit || null,
    accessPolicy: policyStatus,
    latestAuthentication: latestAuth
      ? {
          allowed: latestAuth.allowed === true,
          action: latestAuth.action || null,
          createdAt: latestAuth.created_at || null,
          application: latestAuth.app_domain || null,
        }
      : null,
  };
}

function identityLabel(row) {
  return row.kind === "admin" ? "administrator" : `${row.kind}:${row.ref_id}`;
}

function findPortalApplication(apps) {
  if (!Array.isArray(apps)) return null;
  return apps.find((candidate) => candidate?.aud === policyAud)
    || apps.find((candidate) => String(candidate?.domain || "").includes("vojtechsteidl.eu/student-portal"))
    || null;
}

async function latestAuthentication(email, appId) {
  const params = new URLSearchParams({
    email,
    emailOp: "eq",
    app_uid: appId,
    app_uidOp: "eq",
    direction: "desc",
    per_page: "1",
  });
  const logs = await cloudflare(
    `/accounts/${encodeURIComponent(accountId)}/access/logs/access_requests?${params}`,
    { optional: true },
  );
  return Array.isArray(logs) ? logs[0] || null : null;
}

const identities = resultRows(runD1(`
  SELECT 'student' AS kind,
         s.id AS ref_id,
         s.display_name,
         s.email,
         s.enabled,
         CASE WHEN p.student_id IS NULL THEN 0 ELSE 1 END AS has_profile,
         (SELECT MAX(v.last_seen_at)
            FROM student_portal_visits AS v
           WHERE v.student_id = s.id) AS last_portal_visit
    FROM students AS s
    LEFT JOIN student_profiles AS p ON p.student_id = s.id
  UNION ALL
  SELECT 'admin' AS kind,
         a.email AS ref_id,
         'Administrator' AS display_name,
         a.email,
         a.enabled,
         1 AS has_profile,
         NULL AS last_portal_visit
    FROM portal_admins AS a
   ORDER BY kind DESC, display_name COLLATE NOCASE;
`));

const report = {
  checkedAt: new Date().toISOString(),
  d1Reachable: true,
  accessApplicationsReachable: false,
  accessPoliciesReachable: false,
  accessLogsReachable: false,
  applicationFound: false,
  identities: [],
  errors: [],
  warnings: [],
};

const active = identities.filter((row) => Number(row.enabled) === 1);
for (const row of active) {
  if (!normalizedEmail(row.email)) report.errors.push(`${identityLabel(row)}:missing-email`);
  if (row.kind === "student" && Number(row.has_profile) !== 1) {
    report.errors.push(`student:${row.ref_id}:missing-profile`);
  }
}

try {
  const accountApps = await cloudflare(`/accounts/${encodeURIComponent(accountId)}/access/apps?per_page=100`, {
    optional: true,
  });
  if (Array.isArray(accountApps)) report.accessApplicationsReachable = true;
  let app = findPortalApplication(accountApps);
  let accessScope = app ? { type: "accounts", id: accountId } : null;

  if (!app) {
    const zones = await cloudflare(
      `/zones?name=vojtechsteidl.eu&account.id=${encodeURIComponent(accountId)}&per_page=10`,
      { optional: true },
    );
    for (const zone of Array.isArray(zones) ? zones : []) {
      const zoneApps = await cloudflare(`/zones/${encodeURIComponent(zone.id)}/access/apps?per_page=100`, {
        optional: true,
      });
      if (Array.isArray(zoneApps)) report.accessApplicationsReachable = true;
      app = findPortalApplication(zoneApps);
      if (app) {
        accessScope = { type: "zones", id: zone.id };
        break;
      }
    }
  }

  if (!app?.id || !accessScope) {
    if (report.accessApplicationsReachable) {
      report.errors.push("portal-access-application-not-found");
    } else {
      report.warnings.push("access-applications-api-unavailable");
    }
  } else {
      report.applicationFound = true;
      const policies = await cloudflare(
        `/${accessScope.type}/${encodeURIComponent(accessScope.id)}/access/apps/${encodeURIComponent(app.id)}/policies?per_page=1000`,
        { optional: true },
      );
      if (!Array.isArray(policies)) {
        report.warnings.push("access-policies-api-unavailable");
      } else {
        report.accessPoliciesReachable = true;
        let logsSupported = true;
        for (const row of active) {
          const email = normalizedEmail(row.email);
          const coverage = email ? policyCoverage(email, policies) : "missing";
          let latestAuth = null;
          if (email && logsSupported) {
            latestAuth = await latestAuthentication(email, app.id);
            if (latestAuth === null) {
              // A null result can also mean "no attempts". Keep probing other identities;
              // API permission is reported separately through the summary below.
            } else {
              report.accessLogsReachable = true;
            }
          }
          report.identities.push(safeIdentity(row, coverage, latestAuth));
          if (coverage === "missing") report.errors.push(`${identityLabel(row)}:not-in-access-policy`);
          if (coverage === "unknown") report.errors.push(`${identityLabel(row)}:access-policy-not-provable`);
        }
      }
  }
} catch (error) {
  report.warnings.push(`access-audit-error:${error instanceof Error ? error.message : "unknown"}`);
}

if (!report.identities.length) {
  report.identities = active.map((row) => safeIdentity(row, "not-checked", null));
}

console.log("PORTAL_ACCESS_AUDIT_BEGIN");
console.log(JSON.stringify(report, null, 2));
console.log("PORTAL_ACCESS_AUDIT_END");

const blocking = report.errors.filter((error) =>
  /missing-email|missing-profile|not-in-access-policy|portal-access-application-not-found/.test(error),
);
if (blocking.length) process.exitCode = 2;
