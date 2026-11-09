# Local operations

Verified on 2026-11-09:

- Frontend: http://localhost:3107, API: http://localhost:5042.
- API source: backend/GymHung.Api; SQL instance: .\SQLEXPRESS; database: gymhung_demo.
- Frontend .env.local uses VITE_USE_MOCK=false.
- Authenticated workspace reads succeeded for Admin (44 members), Staff (44), Trainer (8), Member (1).
- Backend tests: 8 passed. Frontend production build passed.
- COPY_ONLY database backup with CHECKSUM and RESTORE VERIFYONLY succeeded. Default SQL backup directory contains the timestamped .bak file.

Run backend with the .NET 10 SDK: dotnet run --project GymHung.Api --launch-profile http (from backend).
Run frontend: npm run dev -- --host localhost --port 3107 (from frontend).
Run backup: powershell -File backend/Backup-Database.ps1. Schedule this script using a service identity with SQL backup privileges and monitor its exit code.

Full restore drill completed into gymhung_restore_verify_20261109, with 44 members and DBCC CHECKDB reporting no errors. The restored database is retained for inspection.

Isolated API verification on port 5043 passed login, anonymous denial, Member denial for Staffs, concurrent capacity (one success and one 409), duplicate booking rejection, trainer overlap rejection and cancellation participant recount. Reproduce with backend/verify-business.mjs and GYM_VERIFY_PASSWORD configured; use only the isolated restored database. Test API was stopped afterward.

System.Security.Cryptography.Pkcs is pinned to 10.0.14; isolated API build completed with zero warnings/errors and all 8 backend tests passed after upgrade. The existing API process on 5042 still requires restart onto the updated binaries.

Payment/check-in HTTP verification also passed: member creation, missing-package check-in rejection, package price snapshot, incorrect payment amount rejection, simultaneous cash confirmation (one transaction plus idempotent replay), revenue increased exactly once, concurrent check-in (one success, one rejection) and checkout.

Frontend lint, 64 tests and production build passed after correcting query-hook dependencies, AI conversation selection and accessible filter/status markup. Build retains nonblocking bundle-size/dynamic-import advisories.

Remaining production gates: production JWT secret and HTTPS/domain deployment, mail delivery for password recovery, payment provider integration if online collection is required, full rendered UI verification, and restarting the live API onto patched binaries. Current electronic payment confirmation and AI providers are demonstration implementations. Do not interpret local build/tests as production certification.
