import {
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const ciphertextPath = ".ops/d1-student-bootstrap.json";
const databaseId = "34173dc8-5cb4-4e2a-9fb6-3de6d9e72de1";
const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";

if (!apiToken || !accountId) throw new Error("Cloudflare deployment credentials are unavailable.");

const seed = createHash("sha256")
  .update("d1-student-bootstrap-v1\0")
  .update(apiToken)
  .digest();
const privateKey = createPrivateKey({
  key: Buffer.concat([
    Buffer.from("302e020100300506032b656e04220420", "hex"),
    seed,
  ]),
  format: "der",
  type: "pkcs8",
});
const publicKey = createPublicKey(privateKey);

if (!existsSync(ciphertextPath)) {
  const encoded = publicKey.export({ format: "der", type: "spki" }).toString("base64");
  console.log(`D1_BOOTSTRAP_PUBLIC_KEY=${encoded}`);
  process.exit(0);
}

const envelope = JSON.parse(readFileSync(ciphertextPath, "utf8"));
const senderPublicKey = createPublicKey({
  key: Buffer.from(String(envelope.ephemeralPublicKey || ""), "base64"),
  format: "der",
  type: "spki",
});
const shared = diffieHellman({ privateKey, publicKey: senderPublicKey });
const key = createHash("sha256")
  .update(shared)
  .update("d1-student-bootstrap-aes-v1")
  .digest();
const decipher = createDecipheriv(
  "aes-256-gcm",
  key,
  Buffer.from(String(envelope.iv || ""), "base64"),
);
decipher.setAuthTag(Buffer.from(String(envelope.authTag || ""), "base64"));
const plaintext = Buffer.concat([
  decipher.update(Buffer.from(String(envelope.ciphertext || ""), "base64")),
  decipher.final(),
]);
const payload = JSON.parse(plaintext.toString("utf8"));
const students = Array.isArray(payload.students) ? payload.students : [];

if (students.length !== 2) throw new Error("Encrypted payload must contain exactly two students.");

function profileFor(displayName) {
  return {
    studentName: displayName,
    studentInitials: displayName.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => Array.from(part)[0] || "").join("").toLocaleUpperCase("cs-CZ"),
    completedLessonsCount: 0,
    progress: 0,
    progressText: "Studijní profil byl vytvořen.",
    priority: {
      title: "Začínáme",
      text: "Po první hodině zde bude aktuální priorita.",
      deadline: "Bez termínu",
    },
    readiness: { label: "Studijní postup", lessonWeight: 60, taskWeight: 40 },
    lessons: [],
    materials: [],
    tasks: [],
    timeline: [],
    upcoming: [],
    links: [],
    externalLessons: [],
    incrementLessonCountOnMaterialAdd: false,
  };
}

const statements = [];
for (const student of students) {
  const id = String(student.id || "").trim().toLowerCase();
  const displayName = String(student.displayName || "").normalize("NFKC").trim();
  const email = String(student.email || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(id)
    || !displayName || displayName.length > 80
    || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Encrypted student data failed validation.");
  }
  statements.push({
    sql: `INSERT INTO students (id, email, display_name, material_path, enabled)
          VALUES (?1, ?2, ?3, ?1, 1)
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            display_name = excluded.display_name,
            material_path = excluded.material_path,
            enabled = 1,
            updated_at = CURRENT_TIMESTAMP`,
    params: [id, email, displayName],
  });
  statements.push({
    sql: `INSERT INTO student_profiles (student_id, payload_json)
          VALUES (?1, ?2)
          ON CONFLICT(student_id) DO NOTHING`,
    params: [id, JSON.stringify(profileFor(displayName))],
  });
}

for (const statement of statements) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(statement),
    },
  );
  const result = await response.json();
  if (!response.ok || result.success !== true
    || !Array.isArray(result.result) || result.result.some((item) => item.success !== true)) {
    const safeErrors = [
      ...(Array.isArray(result.errors) ? result.errors : []),
      ...(Array.isArray(result.result)
        ? result.result.flatMap((item) => Array.isArray(item.errors) ? item.errors : [])
        : []),
    ].map((error) => ({
      code: typeof error?.code === "number" ? error.code : null,
      message: String(error?.message || "Unknown D1 error").slice(0, 300),
    }));
    throw new Error(`Cloudflare D1 rejected the encrypted bootstrap (HTTP ${response.status}): ${JSON.stringify(safeErrors)}`);
  }
}
console.log("Encrypted D1 student bootstrap completed for 2 records.");
