# Azure master plan (single source of truth)

This is the only document that contains the full Azure plan and the current progress. If another document conflicts with this plan, this plan wins.

## Goals

- Healthcare-grade security and privacy.
- Full online operation (works on any computer).
- Clear path to compliance and auditability.
- No secrets in the client.
- Scalable without rewriting the architecture later.

## Current status (high level)

- Plan consolidated into this document: **Done**
- Webapp config switched to environment variables: **Done**
- Azure resources provisioned: **In progress (RG, DB, Storage done; App Service, Key Vault, App Insights not yet)**
- Backend deployed to Azure: **Done (App Service running, /health OK)**
- Database schema applied in Azure: **Done**
- Entra External ID configured: **In progress (tenant + apps + email/password done; token validation unknown)**

## Target architecture (Azure)

- **Auth**: Microsoft Entra External ID (Customer identities).
- **Backend**: Node/Express API in `server/`, hosted on Azure App Service (Linux).
- **Database**: Azure Database for PostgreSQL Flexible Server.
- **Storage**: Azure Blob Storage for encrypted audio uploads.
- **Secrets**: Azure Key Vault + Managed Identity.
- **Monitoring**: Application Insights + Log Analytics.

## Security rules (healthcare-grade)

- No secrets in client apps.
- HTTPS everywhere.
- Private storage containers.
- Short-lived upload permissions (SAS).
- Avoid logging sensitive content (transcripts, audio, tokens, keys).
- Database access only from backend.

## Phase-by-phase plan with status

### Phase 0: Prepare codebase (Status: In progress)

- Use environment variables in the webapp for API and Entra settings. **Done**
- Ensure secure error messages do not mention secrets. **Done**
- Confirm no client-side secrets exist. **In progress**

### Phase 1: Provision Azure resources (Status: In progress)

- Create Resource Group (EU region). **Done (jnlsolutions-coachscribe, West Europe)**
- Create Azure Database for PostgreSQL Flexible Server. **Done (jnlsolutions-coachscribe-1, Belgium Central)**
- Create Azure Storage Account and `transcription-uploads` container. **Done (jnlsolutionscoachscribe / transcription-uploads)**
- Create Azure App Service (Linux). **Done (coachscribe-api, West Europe)**
- Create Azure Key Vault. **Done (coachscribe-kv, West Europe)**
- Create Application Insights workspace. **Done (coachscribe-api, West Europe)**

### Phase 2: Configure Entra External ID (Status: In progress)

- Create External ID tenant. **Done**
- Register apps (web, mobile, backend API). **Done (coachscribe-mobile, coachscribe-api; mobile used for web too)**
- Configure email + password, and optionally Microsoft sign-in. **Done (email + password only)**
- Confirm access tokens for backend API. **Unknown (user unsure)**

### Phase 3: Apply database schema (Status: Done)

- Create database `coachscribe`. **Done**
- Run:
  - `server/sql/001_init.sql` **Done (tables present)**
  - `server/sql/002_entra_external_id.sql` **Done (entra_user_id column present, sessions table removed)**
  - `server/sql/003_app_data.sql` **Not started**

### Phase 4: Configure backend for Azure (Status: In progress)

- Set App Service environment variables: **Done (set in App Service env vars)**
  - `DATABASE_URL`
  - `DATABASE_SSL=1`
  - `AZURE_STORAGE_ACCOUNT_NAME`
  - `AZURE_STORAGE_ACCOUNT_KEY` (temporary until Key Vault)
  - `AZURE_STORAGE_TRANSCRIPTION_UPLOADS_CONTAINER=transcription-uploads`
  - `ENTRA_OPENID_CONFIGURATION_URL`
  - `ENTRA_AUDIENCE`
  - `MISTRAL_API_KEY` (if transcription is enabled)
  - `REVENUECAT_SECRET_KEY` (if billing sync is enabled)
- Lock down CORS to approved domains only. **Done (CORS_ALLOWED_ORIGINS set)**

### Phase 5: Deploy backend (Status: Done)

- Deploy `server/` to Azure App Service. **Done**
- Verify `GET /health` returns `{ ok: true }`. **Done**
- Verify `POST /auth/me` works with an Entra access token. **Done**

### Phase 6: Point clients to production (Status: Not started)

- Set Expo web/app environment variables:
  - `EXPO_PUBLIC_FUNCTIONS_BASE_URL`
  - `EXPO_PUBLIC_ENTRA_OPENID_CONFIGURATION_URL`
  - `EXPO_PUBLIC_ENTRA_CLIENT_ID`
  - `EXPO_PUBLIC_ENTRA_API_SCOPE`
  - `EXPO_PUBLIC_ENTRA_ACCOUNT_PORTAL_URL` (optional)
- Verify end-to-end login and API calls in webapp and mobile app.

### Phase 7: Post-launch hardening (Status: Not started)

- Move secrets to Key Vault and use Managed Identity.
- Enable stricter firewall/VNet rules.
- Add regular backups and restore tests.
- Verify logs are clean of sensitive data.

