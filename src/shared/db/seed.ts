import { db, schema } from './client';

/**
 * Dados de exemplo para a Sprint 1: o front constroi contra isso desde a
 * primeira hora, antes de os casos de uso reais existirem.
 *
 *   npm run db:seed
 */
async function semear(): Promise<void> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({ slug: 'demo', nome: 'Consultorio Demonstracao' })
    .onConflictDoNothing()
    .returning();

  if (tenant === undefined) {
    console.warn('[seed] tenant "demo" ja existe — nada a fazer.');
    return;
  }

  await db.insert(schema.servicos).values([
    { tenantId: tenant.id, nome: 'Consulta', duracaoMin: 50, intervaloMin: 10 },
    { tenantId: tenant.id, nome: 'Retorno', duracaoMin: 30, intervaloMin: 10 },
  ]);

  // Segunda a sexta, das 9h as 12h e das 14h as 18h.
  await db.insert(schema.jornadas).values(
    [1, 2, 3, 4, 5].flatMap((dia) => [
      { tenantId: tenant.id, diaDaSemana: dia, inicioMin: 9 * 60, fimMin: 12 * 60 },
      { tenantId: tenant.id, diaDaSemana: dia, inicioMin: 14 * 60, fimMin: 18 * 60 },
    ]),
  );

  console.warn('[seed] tenant "demo" criado.');
}

semear()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('[seed] falhou', e);
    process.exit(1);
  });
