# Azure setup (step-by-step)

This document assumes:

- You already have an Azure account.
- You want to run:
  - `server/` on Azure App Service (Linux)
  - Postgres on Azure Database for PostgreSQL Flexible Server
  - encrypted audio uploads in Azure Blob Storage
  - auth via Microsoft Entra External ID (Customer identities)

## 1) Create a Resource Group

- Azure Portal → search **Resource groups**
- Create
  - Name: `jnlsolutions-coachscribe`
  - Region: West Europe

## 2) Create Azure Database for PostgreSQL Flexible Server

- Azure Portal → **Create a resource**
- Search: **Azure Database for PostgreSQL Flexible Server**
- Create with:
  - Region: Belgium-central
  - Workload type: Development (if available)
  - Compute tier: Burstable
  - Size: `Standard_B1ms` (good for early low usage)
  - High availability: Off (for now)
  - Backups: On (keep default retention or increase later)

### Networking

For simplest setup early on:

- Allow public access
- Add your current IP to the firewall rules
- (Later) switch to VNet/private networking when you need it

### Create database schema

You need to connect to the Postgres server and execute two SQL files:

- `server/sql/001_init.sql`
- `server/sql/002_entra_external_id.sql`

There are two simple ways to do this.

### Option A (recommended): Azure Portal “Cloud Shell” + `psql`

Some Azure portal views do not show a Query editor for PostgreSQL Flexible Server. Cloud Shell works reliably.

1) Azure Portal → open your **PostgreSQL flexible server** resource (not the resource group)
2) In the left menu, open **Networking** and temporarily enable:
   - **Allow public access from any Azure service within Azure to this server** = Yes
   - Save
   - Reason: Cloud Shell runs inside Azure, so your server firewall must allow Azure-to-Azure traffic.
2) In the top bar, click the **Cloud Shell** icon (it looks like `>_`)
3) Choose **Bash**
4) Install `psql` if needed:

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

5) Run the commands (replace placeholders):

```bash
export PGPASSWORD='<your-password>'
psql -h '<server_name>.postgres.database.azure.com' -U '<administrator_login>@<server_name>' -d postgres -p 5432 -c 'create database coachscribe;'
psql -h '<server_name>.postgres.database.azure.com' -U '<administrator_login>@<server_name>' -d coachscribe -p 5432 -f server/sql/001_init.sql
psql -h '<server_name>.postgres.database.azure.com' -U '<administrator_login>@<server_name>' -d coachscribe -p 5432 -f server/sql/002_entra_external_id.sql
```

### Option B: `psql` from your Windows machine

1) In Azure Portal → your Postgres server → **Connect** → copy the connection details:
   - Host: something like `<server_name>.postgres.database.azure.com`
   - Username: `<administrator_login>@<server_name>`
   - Port: `5432`
2) Install the Postgres client tools (so `psql` exists) if you do not have them yet.
3) From the repo root in PowerShell, run:

```powershell
$env:PGPASSWORD = "<your-password>"
psql -h "<server_name>.postgres.database.azure.com" -U "jnlsolutions_admin@jnlsolutions-coachscribe-1" -d postgres -p 5432 -c "create database coachscribe;"
psql -h "<server_name>.postgres.database.azure.com" -U "jnlsolutions_admin@jnlsolutions-coachscribe-1" -d coachscribe -p 5432 -f "server/sql/001_init.sql"
psql -h "<server_name>.postgres.database.azure.com" -U "jnlsolutions_admin@jnlsolutions-coachscribe-1" -d coachscribe -p 5432 -f "server/sql/002_entra_external_id.sql"
```

If you get a connection error, the most common cause is the firewall. In Azure Portal → your Postgres server → **Networking**, make sure your current IP is allowed.

After you are done running SQL from Cloud Shell, you can set **Allow public access from any Azure service within Azure to this server** back to No to tighten security.

## 3) Create a Storage Account + Blob container

- Azure Portal → **Storage accounts** → Create
  - Region: same EU region
  - Performance: Standard
  - Redundancy: LRS (cheapest)

After it’s created:

- Storage account → **Data storage** → **Containers**
- Create container:
  - Name: `transcription-uploads`
  - Public access level: Private

## 4) Configure Microsoft Entra External ID

You will need:

- An External ID tenant for customer identities
- A registered application for the CoachScribe client (mobile + web)
- A registered application for the backend API

What the code expects:

- The app uses **OpenID Connect authorization code + PKCE**.
- The backend verifies access tokens using:
  - **OpenID configuration URL** (discovery document)
  - **Audience** (the API identifier)

### Common issue: “Admin approval required”

If, after signing up/signing in, you see a message like **“Need admin approval”** / **“Admin approval required”**, it means the client app is requesting an API scope that requires tenant admin consent.

Fix (recommended): grant admin consent once for the mobile app.

1) Entra admin center → **App registrations** → `coachscribe-mobile`
2) **API permissions**
3) Ensure the permission to `coachscribe-api` exists (delegated scope `access_as_user`)
4) Click **Grant admin consent** for your tenant

After that, sign-in should proceed without the approval screen.

### Making the sign-in page look professional (branding)

The login/sign-up screen is Microsoft-hosted (this is normal in production too), but you can brand it:

- Entra admin center → **External Identities** → **User flows** → select your flow
- Look for **Branding / Page layouts / Company branding**
  - Upload your logo
  - Set background color/image
  - Adjust layout options

You can also add a custom domain later (e.g. `auth.coachscribe.nl`) so the URL looks nicer, but it’s optional for initial launch.

### Values you must copy into configuration

#### Backend (`server/.env`)

- `ENTRA_OPENID_CONFIGURATION_URL`
  - This is the `.well-known/openid-configuration` URL from your External ID tenant + policy/user flow.
- `ENTRA_AUDIENCE`
  - This must match the `aud` claim of your access token.
  - In Entra External ID (CIAM), `aud` is often the **API app’s Application (client) ID** (a GUID), not the `api://...` URI.
  - You can provide multiple allowed audiences as a comma-separated list.

#### App (EAS env vars)

- `EXPO_PUBLIC_ENTRA_OPENID_CONFIGURATION_URL`
- `EXPO_PUBLIC_ENTRA_CLIENT_ID`
- `EXPO_PUBLIC_ENTRA_API_SCOPE`
  - This should be a scope the API exposes, for example: `api://<api-app-id>/access_as_user`

## 5) Deploy the backend to Azure App Service

- Azure Portal → **App Services** → Create
  - Publish: Code
  - Runtime stack: Node 20+
  - OS: Linux
  - Plan: start with the cheapest that supports Always On (or accept cold starts in early dev)

### Set app settings (environment variables)

App Service → Configuration → Application settings:

- `DATABASE_URL`
- `DATABASE_SSL=1`
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_STORAGE_TRANSCRIPTION_UPLOADS_CONTAINER=transcription-uploads`
- `ENTRA_OPENID_CONFIGURATION_URL`
- `ENTRA_AUDIENCE`
- `MISTRAL_API_KEY` (if you want transcription)
- `REVENUECAT_SECRET_KEY` (if you want billing sync)

## 6) Configure the app

For production builds, set EAS environment variables (these are also used by the webapp when you run it through Expo Web):

- `EXPO_PUBLIC_FUNCTIONS_BASE_URL` (your App Service URL)
- `EXPO_PUBLIC_ENTRA_OPENID_CONFIGURATION_URL`
- `EXPO_PUBLIC_ENTRA_CLIENT_ID`
- `EXPO_PUBLIC_ENTRA_API_SCOPE`
- `EXPO_PUBLIC_ENTRA_ACCOUNT_PORTAL_URL` (optional, defaults to Microsoft account portal)

## 7) Quick smoke test

1) Start server locally with a `.env` and confirm:
   - `POST /health` returns `ok: true`
2) Run the app and tap **Doorgaan**
3) After sign-in, confirm the app reaches the backend:
   - `POST /auth/me` works (server creates or updates `public.users`)

