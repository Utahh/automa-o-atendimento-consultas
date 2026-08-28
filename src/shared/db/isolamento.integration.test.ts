import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Os testes de segurança que não podem sumir.
 *
 * Rodam contra um Postgres de verdade, com as migrations e o `rls.sql` já
 * aplicados — e como o papel `kairo_app`, que é NOSUPERUSER e NOBYPASSRLS.
 * Rodar como dono do banco esconde exatamente a falha que estes testes
 * existem para pegar.
 *
 * Sem DATABASE_URL, o arquivo inteiro é pulado: `npm test` continua sendo
 * rápido na máquina de quem desenvolve, e o CI roda a versão completa no job
 * que sobe o Postgres.
 */

const URL_DO_BANCO = process.env.DATABASE_URL;

describe.skipIf(URL_DO_BANCO === undefined)('isolamento entre clientes', () => {
  let cliente: Client;
  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';

  beforeAll(async () => {
    cliente = new Client({ connectionString: URL_DO_BANCO });
    await cliente.connect();

    // Semeia como dono, fora de qualquer política.
    await cliente.query(
      `insert into tenant (id, slug, nome) values
         ($1, 'teste-a', 'Tenant A'),
         ($2, 'teste-b', 'Tenant B')
       on conflict (id) do nothing`,
      [tenantA, tenantB],
    );
    await cliente.query(
      `insert into cliente (tenant_id, nome) values ($1, 'Bia do A'), ($2, 'Bia do B')`,
      [tenantA, tenantB],
    );

    // A partir daqui, tudo roda como a aplicação roda.
    await cliente.query('set role kairo_app');
  });

  afterAll(async () => {
    await cliente.query('reset role');
    await cliente.query('delete from tenant where id = any($1)', [[tenantA, tenantB]]);
    await cliente.end();
  });

  it('query FORA de withTenant() falha, em vez de devolver dado', async () => {
    await cliente.query("select set_config('app.tenant_id', '', true)");
    await expect(cliente.query('select id from cliente')).rejects.toThrow(/TENANT_AUSENTE/);
  });

  it('o tenant A não vê o dado do tenant B', async () => {
    await cliente.query('begin');
    await cliente.query("select set_config('app.tenant_id', $1, true)", [tenantA]);

    const { rows } = await cliente.query<{ nome: string }>('select nome from cliente');
    await cliente.query('commit');

    expect(rows.map((r) => r.nome)).toEqual(['Bia do A']);
  });

  it('não deixa escrever no tenant de outra pessoa', async () => {
    await cliente.query('begin');
    await cliente.query("select set_config('app.tenant_id', $1, true)", [tenantA]);

    // O `with check` da política barra a escrita mesmo com o id na mão.
    await expect(
      cliente.query('insert into cliente (tenant_id, nome) values ($1, $2)', [tenantB, 'invasor']),
    ).rejects.toThrow();

    await cliente.query('rollback');
  });

  it('a constraint impede dois agendamentos no mesmo horário', async () => {
    await cliente.query('begin');
    await cliente.query("select set_config('app.tenant_id', $1, true)", [tenantA]);

    const { rows: servicos } = await cliente.query<{ id: string }>(
      `insert into servico (tenant_id, nome, duracao_min) values ($1, 'Corte', 60) returning id`,
      [tenantA],
    );
    const { rows: clientes } = await cliente.query<{ id: string }>(
      'select id from cliente limit 1',
    );
    const servicoId = servicos[0]?.id;
    const clienteId = clientes[0]?.id;
    expect(servicoId).toBeDefined();
    expect(clienteId).toBeDefined();

    const marcar = (inicio: string, fim: string) =>
      cliente.query(
        `insert into agendamento (tenant_id, cliente_id, servico_id, inicio, fim)
         values ($1, $2, $3, $4, $5)`,
        [tenantA, clienteId, servicoId, inicio, fim],
      );

    await marcar('2026-09-01T13:00:00Z', '2026-09-01T14:00:00Z');

    // A constraint do banco é a ÚLTIMA garantia: vale para quem marca a dedo,
    // para a página pública e para o agente, sem nenhum deles saber dela.
    await expect(marcar('2026-09-01T13:30:00Z', '2026-09-01T14:30:00Z')).rejects.toThrow();

    await cliente.query('rollback');
  });

  it('toda tabela de negócio tem RLS ligada', async () => {
    await cliente.query('reset role');
    const { rows } = await cliente.query<{ tablename: string }>(
      `select tablename from pg_tables
       where schemaname = 'public'
         and tablename not in ('__drizzle_migrations', 'webhook_recebido')
         and not rowsecurity`,
    );
    await cliente.query('set role kairo_app');

    expect(rows.map((r) => r.tablename)).toEqual([]);
  });
});
