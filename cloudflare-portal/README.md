# Secure Cloudflare portal migration

This directory is a staging scaffold for moving `vojtechsteidl.eu` away from a public-data GitHub Pages architecture.

## Security model

- Public website assets are built from an explicit allowlist.
- `students/*.json`, `docs/`, `.uploads/` and scripts are never copied into the deployment artifact.
- Student profile data is stored in Cloudflare D1.
- Cloudflare Access authenticates the user.
- The Worker validates the signed `Cf-Access-Jwt-Assertion` JWT before trusting identity.
- The authenticated email is mapped to exactly one student record in D1.
- `/Materials/<student>/...` is served only when the authenticated student's configured `material_path` matches the requested path.
- Legacy `/students/*` URLs always return 404.

## Controlled end-to-end test account

Use student id `vojta2` as the permanent smoke-test identity for the complete login path. The repository contains only a non-sensitive minimal profile fixture at `fixtures/vojta2.profile.json`; the real test email must exist only in Cloudflare Access/D1 and must never be committed.

The test passes only when the tester can authenticate through the same Access application as normal students and sees the `Vojta2` D1-backed dashboard. This verifies OTP/IdP authentication, Access policy evaluation, JWT validation, email-to-student mapping and D1 profile loading in one flow.

To bootstrap the account manually in the Cloudflare D1 dashboard, use `sql/vojta2-test.sql.template`, replace `__VOJTA2_EMAIL__` only in the Cloudflare console, execute it against `vojtechsteidl-portal`, and add the same address to the application's explicit Email allow policy.

## Required Cloudflare values before deployment

The checked-in `wrangler.jsonc` intentionally contains invalid placeholders so it cannot be deployed accidentally.

1. Create D1 database `vojtechsteidl-portal` and replace `REPLACE_AFTER_D1_CREATE` with its database ID.
2. Create a Cloudflare Access self-hosted application for the portal hostname (recommended: `portal.vojtechsteidl.eu`).
3. Use One-time PIN or another identity provider and allow only the intended student/parent email addresses.
4. Copy the Access team domain into `TEAM_DOMAIN`, including `https://`.
5. Copy the Access application audience (AUD) tag into `POLICY_AUD`.

## Local preparation

```bash
npm install
npm run build
npm run typecheck
```

Generate a private D1 seed without committing personal data:

```bash
cp student-emails.example.json student-emails.json
# edit student-emails.json with the real authorised email mapping
npm run db:seed
```

Both `student-emails.json` and `seed.private.sql` are gitignored.

## Database

Apply the schema:

```bash
npm run db:migrate:remote
```

Then execute the generated `seed.private.sql` against D1 using Wrangler after reviewing it locally.

## Deployment sequence

1. Keep the existing production site untouched.
2. Copy the repository into a new **private** GitHub repository.
3. Configure the Cloudflare values above in that private repository/deployment.
4. Build and deploy to a non-production hostname first.
5. Verify that an unauthenticated request to the portal is blocked.
6. Verify that each authorised email sees only its own profile and materials.
7. Verify that requesting another student's material path returns 403.
8. Only then switch the production portal link/domain.
9. After successful cutover, make the legacy repository private and perform history cleanup for previously published personal data.

Do not merge or deploy this branch as a substitute for making the legacy repository private. Removing files from the current branch alone does not remove them from public Git history.
