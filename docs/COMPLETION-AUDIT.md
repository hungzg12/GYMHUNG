# Completion audit

Verified evidence as of 2026-11-09:

| Requirement | Evidence | Remaining |
| --- | --- | --- |
| SQL and API | Four role logins and scoped workspace reads; browser dashboard/members read SQL; live API replaced with current Release publish and rechecked (34 tables, 44 members, recovery endpoint) | Full UI workflow coverage |
| Login/permissions | HTTP anonymous/forbidden checks; password-change token revocation; 64 frontend and 8 backend tests | Full per-role rendered UI matrix |
| Members/packages | Composite member creation, price snapshot; suspended package/member denies check-in; canceled package cannot reactivate; renewal creates distinct row; renewal UI tab added | Verify linked CRUD and renewal through rendered UI; freeze-day extension policy not supplied |
| Payments/reports | Concurrent cash confirmation, replay, single transaction and revenue delta | Real online provider credentials/webhooks; receipt/refund workflows require further verification |
| Schedules/check-in | Concurrent capacity, duplicate, overlap, cancellation recount, no-package denial, concurrent check-in, checkout | Full UI workflows |
| Recovery | Encrypted token wrong/expired/single-use/replay/persistence checks on isolated SQL | Actual SMTP delivery |
| Backup/restore | COPY_ONLY CHECKSUM backup, VERIFYONLY, isolated restore, CHECKDB and 44 restored members | Scheduled/off-machine backup destination |
| Security dependencies | Pkcs pinned 10.0.14, API builds without warnings; live API uses current Release binaries | Public hosting configuration |
| Deployment | Production refuses missing key; HSTS and HTTPS origins guard; setup document | Server/domain/TLS/secrets supplied by owner |

These checks do not prove all production requirements are finished. SMTP, online payment and public hosting dependencies must be supplied by the owner; local CRUD and UI verification can continue independently. Start the current backend with backend/Start-Local.ps1; it publishes to its own output and runs on 5042.
