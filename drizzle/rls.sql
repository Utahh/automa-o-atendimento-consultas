-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security.
--
-- Nenhuma tabela de negócio existe sem política. O `app.tenant_id` é fixado
-- por withTenant() dentro da transação; fora dela, a consulta não vê nada.
--
-- Aplicar depois das migrations:
--   psql "$DATABASE_URL" -f drizzle/rls.sql
-- ─────────────────────────────────────────────────────────────────────────

create or replace function app_tenant_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

do $$
declare
  t text;
  tabelas text[] := array['servicos', 'clientes', 'jornadas', 'agendamentos', 'eventos'];
begin
  foreach t in array tabelas loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists %I on %I', t || '_isolamento', t);
    execute format(
      'create policy %I on %I using (tenant_id = app_tenant_id()) with check (tenant_id = app_tenant_id())',
      t || '_isolamento', t
    );
  end loop;
end $$;

-- A tabela de tenants é lida pelo próprio tenant, nunca listada por inteiro.
alter table tenants enable row level security;
drop policy if exists tenants_isolamento on tenants;
create policy tenants_isolamento on tenants
  using (id = app_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────
-- Rota pública: função de escopo mínimo.
-- Devolve SÓ horário livre. Nunca nome de cliente, nunca observação.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function horarios_ocupados_publicos(p_slug text, p_dia date)
returns table (inicio timestamptz, fim timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.inicio, a.fim
  from agendamentos a
  join tenants t on t.id = a.tenant_id
  where t.slug = p_slug
    and a.status in ('pendente', 'confirmado', 'chegou')
    and a.inicio >= p_dia::timestamptz
    and a.inicio < (p_dia + 1)::timestamptz
$$;

revoke all on function horarios_ocupados_publicos(text, date) from public;
grant execute on function horarios_ocupados_publicos(text, date) to public;

-- Constraint é a última garantia: nenhum agendamento ativo se sobrepõe.
create extension if not exists btree_gist;
alter table agendamentos drop constraint if exists agendamentos_sem_sobreposicao;
alter table agendamentos add constraint agendamentos_sem_sobreposicao
  exclude using gist (
    tenant_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status in ('pendente', 'confirmado', 'chegou'));
