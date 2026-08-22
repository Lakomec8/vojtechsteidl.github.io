# D1 smoke-test helpers

`vojta2` is the controlled end-to-end test identity for the student portal.

1. Open the Cloudflare D1 database `vojtechsteidl-portal` and select **Console**.
2. Copy `vojta2-test.sql.template` into the console.
3. Replace `__VOJTA2_EMAIL__` only in the Cloudflare console with the private test address.
4. Execute the transaction.
5. Execute `verify-vojta2.sql` and confirm one enabled `students` row and one `student_profiles` row are returned.
6. Add the same address to the explicit Email allow rule of the Cloudflare Access application protecting the student portal.
7. Test through the normal public student entry point. Do not create a separate bypass route for this account; the purpose is to exercise the same authentication path as production students.

Never commit the real test email to this public repository.
