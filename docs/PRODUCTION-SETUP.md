# Production setup

## Required settings

Deploy the frontend dist directory behind HTTPS. Build it with VITE_USE_MOCK=false and VITE_API_BASE_URL set to the HTTPS API origin.

Publish backend/GymHung.Api with the .NET 10 SDK using dotnet publish -c Release. Configure these environment variables on the server rather than checking secrets into source:

- ASPNETCORE_ENVIRONMENT=Production
- ConnectionStrings__GymDatabase: dedicated SQL login/identity scoped to gymhung_demo
- Jwt__Key: cryptographically random private key, at least 32 bytes
- Jwt__Issuer and Jwt__Audience: matching values for the deployment
- Cors__Origins__0: exact HTTPS frontend origin
- ASPNETCORE_Kestrel__Certificates__Default__Path and ASPNETCORE_Kestrel__Certificates__Default__Password: server TLS certificate configuration

Keep SQL Server behind a firewall. Grant the application only required database permissions; use a separate identity for backups. The API refuses development signing keys and missing/non-HTTPS production origins. Swagger and electronic payment demo confirmation are development-only.

## Backups

Schedule backend/Backup-Database.ps1 daily using Windows Task Scheduler with an authorized SQL backup identity. Monitor nonzero exit codes. Copy backups to an encrypted off-machine destination with an explicit retention policy. The script creates a timestamped COPY_ONLY backup with checksum and verifies the backup. It does not delete old backups.

A full restore drill was performed on 2026-11-09 into gymhung_restore_verify_20261109: restore succeeded, 44 members were present, DBCC CHECKDB returned no errors. Repeat restore drills on a separate SQL instance using RESTORE FILELISTONLY and unique MOVE targets. Never use WITH REPLACE against the live database for a drill.

## Verified business checks

backend/verify-business.mjs verifies 16 API invariants against a restored test database on port 5043, including concurrent booking capacity, schedule overlap, cancellation counts, member creation, package price snapshot, incorrect amount denial, concurrent cash confirmation replay, one revenue increment, concurrent check-in and checkout. Supply GYM_VERIFY_PASSWORD via environment. This verifier creates labeled test records: never point it at the live database.

## External dependencies and limits

The owner must provide the production server/domain, TLS certificate, backup destination and service credentials. No public deployment or scheduled off-site backup is claimed until those are configured and observed.

Online collection requires a contracted payment provider, merchant credentials and signed webhook verification. Current electronic confirmation is a development demo; cash collection is supported and verified. AI currently uses an explicit demo provider. Do not market demo electronic payments or AI as a live provider integration.

## Password recovery

The login page supports forgot-password and resetToken links. Configure Mail__Host, Mail__Port (default 587), Mail__From, Mail__Username, Mail__Password and Mail__ResetUrl (HTTPS login URL). SMTP uses TLS. Without configuration the API returns 503 with a contact-the-gym message. The API uses encrypted Data Protection tickets with a 15-minute deadline and a password-hash stamp; successful reset invalidates the ticket and serialized writes prevent concurrent replay. No token is returned by the API or logged. Persist and protect the ASP.NET Data Protection key ring when deploying multiple replicas or replacing servers.

Set DataProtection__KeyPath to a persistent shared key-ring directory with restrictive service-account permissions. The application discriminator is fixed to GymHung. Monitor recovery mail delivery errors by TraceId: HTTP responses deliberately stay generic to avoid revealing whether a mailbox belongs to an account.

Verified: malformed recovery token returns 400; unconfigured mail returns 503; frontend lint/build and backend build pass. The isolated SQL verifier GymHung.RecoveryVerification directly exercises the recovery controller with encrypted tickets: malformed/expired tickets rejected, concurrent single-use (204/400), replay rejected and new password hash persisted. It uses ephemeral protection keys and only accounts named verify.* in gymhung_restore_verify_20261109. Build to a separate output while the normal API is running: dotnet build GymHung.RecoveryVerification -o artifacts/recovery-verifier; dotnet artifacts/recovery-verifier/GymHung.RecoveryVerification.dll. Actual SMTP delivery still needs a configured TLS SMTP server and remains unverified.

JWTs carry an HMAC-derived password security stamp which is checked against the active user's database hash for every authenticated request. Password change/reset invalidates existing tokens. HTTP verification confirmed changing a newly created test account password returns 204, the old token returns 401, the old password fails and the new password succeeds. The UI logs out after password change. Pre-upgrade tokens without a stamp are rejected and require a fresh login.
