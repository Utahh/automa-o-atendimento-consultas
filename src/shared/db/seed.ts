import { db, schema } from './client';

/**
 * Dados de exemplo da Sprint 1: o front constroi contra isso desde a primeira
 * hora, antes de os casos de uso reais existirem.
 *
 *   npm run db:seed
 */
async function semear(): Promise<void> {
  const [t] = await db
    .insert(schema.tenant)
    .values({ slug: 'demo', nome: 'Estudio Demonstracao', vertical: 'estetica' })
    .onConflictDoNothing()
    .returning();

  if (t === undefined) {
    console.warn('[seed] tenant "demo" ja existe — nada a fazer.');
    return;
  }

  const [sala] = await db
    .insert(schema.local)
    .values({ tenantId: t.id, nome: 'Sala 1' })
    .returning();

  await db.insert(schema.recurso).values({
    tenantId: t.id,
    localId: sala?.id ?? null,
    nome: 'Ana',
  });

  await db.insert(schema.servico).values([
    {
      tenantId: t.id,
      nome: 'Limpeza de pele',
      duracaoMin: 60,
      intervaloMin: 10,
      precoCentavos: 12000,
      cicloRetornoDias: 30,
    },
    {
      tenantId: t.id,
      nome: 'Design de sobrancelha',
      duracaoMin: 30,
      intervaloMin: 5,
      precoCentavos: 5000,
      cicloRetornoDias: 21,
    },
  ]);

  // Segunda a sexta, das 9 h as 12 h e das 14 h as 18 h.
  await db.insert(schema.jornadaTrabalho).values(
    [1, 2, 3, 4, 5].flatMap((dia) => [
      { tenantId: t.id, recursoId: null, diaDaSemana: dia, inicioMin: 9 * 60, fimMin: 12 * 60 },
      { tenantId: t.id, recursoId: null, diaDaSemana: dia, inicioMin: 14 * 60, fimMin: 18 * 60 },
    ]),
  );

  // As reguas nascem ligadas — menos a de sinal, que fica desligada por padrao.
  await db.insert(schema.automacao).values([
    { tenantId: t.id, tipo: 'confirmacao', ativa: true },
    { tenantId: t.id, tipo: 'reoferta', ativa: true },
    { tenantId: t.id, tipo: 'retorno', ativa: true },
  ]);

  console.warn('[seed] tenant "demo" criado.');
}

semear()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('[seed] falhou', e);
    process.exit(1);
  });
