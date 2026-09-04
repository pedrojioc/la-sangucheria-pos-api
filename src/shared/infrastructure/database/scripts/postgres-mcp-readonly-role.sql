-- Dedicated minimum-privilege role for the postgres-mcp (crystaldba) MCP server.
-- Local development use only. Re-run safely (idempotent).
--
-- Usage (prompts for the password interactively, never pass it inline or hardcode it here):
--   psql -U <local-admin> -d la_sangucheria_pos_dev -v role_password="$(read -rsp 'mcp_readonly password: ' pw && echo "$pw")" \
--     -f src/shared/infrastructure/database/scripts/postgres-mcp-readonly-role.sql
--
-- To rotate the password, re-run only the CREATE/ALTER ROLE block below.

\set role_password `openssl rand -base64 24 | tr -d '/+='`

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mcp_readonly') THEN
    EXECUTE format('CREATE ROLE mcp_readonly WITH LOGIN PASSWORD %L', :'role_password');
  ELSE
    EXECUTE format('ALTER ROLE mcp_readonly WITH PASSWORD %L', :'role_password');
  END IF;
END
$$;

\echo Generated password for mcp_readonly (copy it into your local .env as MCP_POSTGRES_URI, then discard):
\echo :role_password

-- Connection + schema visibility
GRANT CONNECT ON DATABASE la_sangucheria_pos_dev TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;

-- Read-only on all current tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;

-- Read-only on tables created by future migrations (owned by the migration runner's role)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;

-- Explicitly no write/DDL grants: no INSERT/UPDATE/DELETE/TRUNCATE, no CREATE, no role membership.
