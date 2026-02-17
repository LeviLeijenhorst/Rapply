# Azure deployment

## 1) Deploy API code
git push origin main

## 2) Run DB change
az account set --subscription "2a01c7e4-a7a4-45c7-aea4-365c8d7346d6"
DB_URL="$(az webapp config appsettings list --resource-group "jnlsolutions-coachscribe" --name "coachscribe-api" --query "[?name=='DATABASE_URL'].value | [0]" -o tsv)"
PGSSLMODE=require psql "$DB_URL" -c "alter table if exists public.session_notes add column if not exists title text not null default '';"

## 3) Verify
curl -sS "https://coachscribe-api-gng3cvgreqfdfke3.westeurope-01.azurewebsites.net/health"
PGSSLMODE=require psql "$DB_URL" -c "select column_name from information_schema.columns where table_schema='public' and table_name='session_notes' and column_name='title';"
