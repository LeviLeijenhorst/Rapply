# Azure deployment

## 1) Deploy API code
git push origin main

## 2) Apply DB migrations
az account set --subscription "2a01c7e4-a7a4-45c7-aea4-365c8d7346d6"
DB_URL="$(az webapp config appsettings list --resource-group "jnlsolutions-coachscribe" --name "coachscribe-api" --query "[?name=='DATABASE_URL'].value | [0]" -o tsv)"
cd server
DATABASE_URL="$DB_URL" DATABASE_SSL=1 npm run apply-db-migrations

## 3) Verify
curl -sS "https://coachscribe-api-gng3cvgreqfdfke3.westeurope-01.azurewebsites.net/health"
PGSSLMODE=require psql "$DB_URL" -c "select filename, applied_at from public.schema_migrations order by applied_at desc limit 5;"
