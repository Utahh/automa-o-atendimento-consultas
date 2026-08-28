import { describe, expect, it } from 'vitest';
import { conferirUrlDaFila } from './boss';

describe('URL da fila', () => {
  it('recusa o pooler em modo transacao pela porta', () => {
    expect(() =>
      conferirUrlDaFila('postgres://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'),
    ).toThrow(/modo SESSAO/);
  });

  it('recusa o pooler em modo transacao pelo parametro', () => {
    expect(() => conferirUrlDaFila('postgres://u:p@host:5432/db?pgbouncer=true')).toThrow(
      /modo SESSAO/,
    );
  });

  it('aceita a conexao direta em modo sessao', () => {
    expect(() =>
      conferirUrlDaFila('postgres://u:p@db.projeto.supabase.co:5432/postgres'),
    ).not.toThrow();
  });
});
