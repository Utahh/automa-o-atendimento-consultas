-- ---------------------------------------------------------------------------
-- Row Level Security.
--
-- Nenhuma tabela de negocio existe sem politica. O `app.tenant_id` e fixado
-- por withTenant() DENTRO da transacao; fora dela, a consulta nao ve nada.
--
-- Aplicar depois das migrations:
--   psql "$DATABASE_URL" -f drizzle/rls.sql
-- ---------------------------------------------------------------------------

-- Query FORA de withTenant() nao devolve zero linhas em silencio: ela FALHA.
-- Silencio parece funcionamento normal e vira bug de producao meses depois;
-- excecao aparece no primeiro teste.
create or replace function app_tenant_id() returns uuid
language plpgsql stable as $$
declare
  v text := current_setting('app.tenant_id', true);
begin
  if v is null or v = '' then
    raise exception 'TENANT_AUSENTE: query fora de withTenant()'
      using errcode = 'insufficient_privilege';
  end if;
  return v::uuid;
end $$;

-- ---------------------------------------------------------------------------
-- O papel da aplicacao. NOSUPERUSER e NOBYPASSRLS de proposito:
-- superusuario ignora RLS, e e por isso que a falha de isolamento so aparece
-- em producao quando o desenvolvimento roda como dono do banco.
--
-- Sem LOGIN: nao existe senha neste arquivo. Em producao a conexao usa um
-- papel proprio, membro deste; nos testes basta `set role kairo_app`.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kairo_app') then
    create role kairo_app nologin nosuperuser nobypassrls;
  end if;
end $$;

grant usage on schema public to kairo_app;
grant select, insert, update, delete on all tables in schema public to kairo_app;
grant execute on all functions in schema public to kairo_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to kairo_app;

do $$
begin
  execute format('grant kairo_app to %I', current_user);
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- ARMADILHA CONHECIDA, JA PAGA POR OUTROS:
--
-- A politica de `membro` NAO pode usar uma funcao que leia `membro` — e
-- recursao infinita, e ela so aparece em producao, porque em desenvolvimento
-- se roda como superusuario. Por isso toda politica aqui compara direto com
-- `app_tenant_id()`, que le apenas uma variavel de sessao.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tabelas text[] := array[
    'membro', 'local', 'recurso', 'servico', 'servico_recurso', 'cliente',
    'jornada_trabalho', 'bloqueio', 'agendamento', 'automacao', 'evento'
  ];
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

-- O tenant e lido pelo proprio tenant, nunca listado por inteiro.
alter table tenant enable row level security;
alter table tenant force row level security;
drop policy if exists tenant_isolamento on tenant;
create policy tenant_isolamento on tenant using (id = app_tenant_id());

-- ---------------------------------------------------------------------------
-- Rota publica: funcao de escopo minimo.
-- Devolve SO horario ocupado. Nunca nome de cliente, nunca observacao,
-- nunca preco de quem ja marcou.
-- ---------------------------------------------------------------------------
create or replace function horarios_ocupados_publicos(p_slug text, p_dia date)
returns table (inicio timestamptz, fim timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.inicio, a.fim
  from agendamento a
  join tenant t on t.id = a.tenant_id
  where t.slug = p_slug
    and a.status in ('pendente', 'confirmado', 'chegou')
    and a.inicio >= p_dia::timestamptz
    and a.inicio < (p_dia + 1)::timestamptz
  union all
  select b.inicio, b.fim
  from bloqueio b
  join tenant t on t.id = b.tenant_id
  where t.slug = p_slug
    and b.inicio < (p_dia + 1)::timestamptz
    and b.fim > p_dia::timestamptz
$$;

revoke all on function horarios_ocupados_publicos(text, date) from public;
grant execute on function horarios_ocupados_publicos(text, date) to public;

-- ---------------------------------------------------------------------------
-- Login: o unico caminho para descobrir o tenant de um usuario.
--
-- Acontece ANTES de existir sessao, entao nao ha `app.tenant_id` para a
-- politica de `membro` comparar. A funcao roda com escopo minimo e exige o
-- id do usuario, que so aparece depois do codigo conferido — nao serve para
-- enumerar nada.
-- ---------------------------------------------------------------------------
create or replace function tenants_do_usuario(p_usuario_id uuid)
returns table (tenant_id uuid, fuso text, nome text)
language sql
security definer
set search_path = public
as $$
  select m.tenant_id, t.fuso, t.nome
  from membro m
  join tenant t on t.id = m.tenant_id
  where m.usuario_id = p_usuario_id
  order by m.criado_em
$$;

revoke all on function tenants_do_usuario(uuid) from public;
grant execute on function tenants_do_usuario(uuid) to kairo_app;

-- ---------------------------------------------------------------------------
-- A constraint do banco e a ULTIMA garantia: nenhum agendamento ativo se
-- sobrepoe no mesmo recurso. Vale para quem marca a dedo e para o agente —
-- e o que faz o agente ser seguro sem precisar ser esperto.
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist;

alter table agendamento drop constraint if exists agendamento_sem_sobreposicao;
alter table agendamento add constraint agendamento_sem_sobreposicao
  exclude using gist (
    tenant_id with =,
    coalesce(recurso_id, tenant_id) with =,
    tstzrange(inicio, fim) with &&
  ) where (status in ('pendente', 'confirmado', 'chegou'));

alter table bloqueio drop constraint if exists bloqueio_intervalo_valido;
alter table bloqueio add constraint bloqueio_intervalo_valido check (fim > inicio);

alter table agendamento drop constraint if exists agendamento_intervalo_valido;
alter table agendamento add constraint agendamento_intervalo_valido check (fim > inicio);
