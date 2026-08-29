import { db, schema } from './client';
import { EMAIL_DEMO, TENANT_DEMO, USUARIO_DEMO } from './ids-de-exemplo';

/**
 * Dados de exemplo da Sprint 1.
 *
 * Cria um tenant completo — usuario, jornada, servicos, clientes e a agenda de
 * hoje — para que o produto possa ser aberto e usado sem nenhuma conta de
 * terceiro. O codigo de acesso sai pelo log do servidor.
 *
 *   npm run db:seed
 */

/** Hoje as HH:MM no fuso do tenant, em instante absoluto. */
function hojeAs(hora: number, minuto = 0): Date {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
}

async function semear(): Promise<void> {
  const [t] = await db
    .insert(schema.tenant)
    .values({ id: TENANT_DEMO, slug: 'demo', nome: 'Estudio da Ana', vertical: 'estetica' })
    .onConflictDoNothing()
    .returning();

  if (t === undefined) {
    console.warn('[seed] tenant "demo" ja existe — nada a fazer.');
    return;
  }

  const [u] = await db
    .insert(schema.usuario)
    .values({ id: USUARIO_DEMO, email: EMAIL_DEMO, nome: 'Ana' })
    .onConflictDoNothing()
    .returning();

  const usuarioId = u?.id ?? USUARIO_DEMO;

  await db.insert(schema.membro).values({ tenantId: t.id, usuarioId, papel: 'dono' });

  const [sala] = await db
    .insert(schema.local)
    .values({ tenantId: t.id, nome: 'Sala 1' })
    .returning();

  await db.insert(schema.recurso).values({
    tenantId: t.id,
    localId: sala?.id ?? null,
    nome: 'Ana',
  });

  const servicos = await db
    .insert(schema.servico)
    .values([
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
      {
        tenantId: t.id,
        nome: 'Massagem relaxante',
        duracaoMin: 50,
        intervaloMin: 10,
        precoCentavos: 15000,
        cicloRetornoDias: 45,
      },
    ])
    .returning();

  const clientes = await db
    .insert(schema.cliente)
    .values([
      { tenantId: t.id, nome: 'Bia Ferraz', telefone: '+5514991110001' },
      { tenantId: t.id, nome: 'Carla Nunes', telefone: '+5514991110002' },
      { tenantId: t.id, nome: 'Duda Prado', telefone: '+5514991110003' },
      { tenantId: t.id, nome: 'Elis Moraes', telefone: '+5514991110004' },
    ])
    .returning();

  // Segunda a sabado, das 9 h as 12 h e das 14 h as 18 h.
  await db.insert(schema.jornadaTrabalho).values(
    [1, 2, 3, 4, 5, 6].flatMap((dia) => [
      { tenantId: t.id, recursoId: null, diaDaSemana: dia, inicioMin: 9 * 60, fimMin: 12 * 60 },
      { tenantId: t.id, recursoId: null, diaDaSemana: dia, inicioMin: 14 * 60, fimMin: 18 * 60 },
    ]),
  );

  // Dois horarios de hoje ja ocupados, para a tela nascer com conteudo.
  const primeiro = servicos[0];
  const segundo = servicos[1];
  if (primeiro !== undefined && segundo !== undefined && clientes[0] && clientes[1]) {
    await db.insert(schema.agendamento).values([
      {
        tenantId: t.id,
        clienteId: clientes[0].id,
        servicoId: primeiro.id,
        inicio: hojeAs(10),
        fim: hojeAs(11),
        status: 'confirmado',
        precoCentavos: primeiro.precoCentavos,
        origem: 'interface',
      },
      {
        tenantId: t.id,
        clienteId: clientes[1].id,
        servicoId: segundo.id,
        inicio: hojeAs(15),
        fim: hojeAs(15, 30),
        status: 'pendente',
        precoCentavos: segundo.precoCentavos,
        origem: 'publico',
      },
    ]);
  }

  // Almoco de hoje bloqueado: o buraco na jornada que nao e agendamento.
  await db.insert(schema.bloqueio).values({
    tenantId: t.id,
    recursoId: null,
    tipo: 'almoco',
    inicio: hojeAs(12),
    fim: hojeAs(14),
    motivo: 'Almoco',
  });

  await db.insert(schema.automacao).values([
    { tenantId: t.id, tipo: 'confirmacao', ativa: true },
    { tenantId: t.id, tipo: 'reoferta', ativa: true },
    { tenantId: t.id, tipo: 'retorno', ativa: true },
  ]);

  console.warn('[seed] pronto. Entre com ' + EMAIL_DEMO + ' — o codigo sai no log do servidor.');
}

semear()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('[seed] falhou', e);
    process.exit(1);
  });
