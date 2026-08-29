import { and, asc, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm';
import { schema, type Tx } from '@/shared/db';
import type { EntradaDaFila } from '../domain/fila';

/** infra/ le e escreve. Nao decide nada. */
export const filaRepo = {
  /** Todas as esperas vivas de um dia — a base da decisao de quem recebe a oferta. */
  async esperando(tx: Tx, de: Date, ate: Date): Promise<readonly EntradaDaFila[]> {
    const linhas = await tx
      .select({
        id: schema.filaEspera.id,
        clienteId: schema.filaEspera.clienteId,
        servicoId: schema.filaEspera.servicoId,
        recursoId: schema.filaEspera.recursoId,
        dia: schema.filaEspera.dia,
        faixa: schema.filaEspera.faixa,
        criadoEm: schema.filaEspera.criadoEm,
      })
      .from(schema.filaEspera)
      .where(
        and(
          eq(schema.filaEspera.status, 'esperando'),
          gte(schema.filaEspera.dia, de),
          lt(schema.filaEspera.dia, ate),
        ),
      )
      .orderBy(asc(schema.filaEspera.criadoEm));

    return linhas;
  },

  /** O mesmo periodo, com o que o estudio precisa ver: quem espera e ate quando. */
  async esperandoComOferta(tx: Tx, de: Date, ate: Date) {
    return tx
      .select({
        id: schema.filaEspera.id,
        dia: schema.filaEspera.dia,
        faixa: schema.filaEspera.faixa,
        criadoEm: schema.filaEspera.criadoEm,
        ofertaExpiraEm: schema.filaEspera.ofertaExpiraEm,
      })
      .from(schema.filaEspera)
      .where(
        and(
          inArray(schema.filaEspera.status, ['esperando', 'ofertado']),
          gte(schema.filaEspera.dia, de),
          lt(schema.filaEspera.dia, ate),
        ),
      )
      .orderBy(asc(schema.filaEspera.dia), asc(schema.filaEspera.criadoEm));
  },

  async doCliente(tx: Tx, clienteId: string) {
    return tx
      .select()
      .from(schema.filaEspera)
      .where(
        and(
          eq(schema.filaEspera.clienteId, clienteId),
          inArray(schema.filaEspera.status, ['esperando', 'ofertado']),
        ),
      )
      .orderBy(asc(schema.filaEspera.dia));
  },

  async porId(tx: Tx, id: string) {
    const [linha] = await tx
      .select()
      .from(schema.filaEspera)
      .where(eq(schema.filaEspera.id, id))
      .limit(1);
    return linha ?? null;
  },

  /** Uma espera viva por cliente + servico + profissional + dia. */
  async jaEspera(
    tx: Tx,
    entrada: {
      readonly clienteId: string;
      readonly servicoId: string;
      readonly recursoId: string | null;
      readonly dia: Date;
    },
  ) {
    const [linha] = await tx
      .select({ id: schema.filaEspera.id })
      .from(schema.filaEspera)
      .where(
        and(
          eq(schema.filaEspera.clienteId, entrada.clienteId),
          eq(schema.filaEspera.servicoId, entrada.servicoId),
          entrada.recursoId === null
            ? isNull(schema.filaEspera.recursoId)
            : eq(schema.filaEspera.recursoId, entrada.recursoId),
          eq(schema.filaEspera.dia, entrada.dia),
          inArray(schema.filaEspera.status, ['esperando', 'ofertado']),
        ),
      )
      .limit(1);
    return linha ?? null;
  },

  async inserir(
    tx: Tx,
    entrada: {
      readonly tenantId: string;
      readonly clienteId: string;
      readonly servicoId: string;
      readonly recursoId: string | null;
      readonly dia: Date;
      readonly faixa: 'manha' | 'tarde' | 'qualquer';
      readonly agendamentoAtualId: string | null;
    },
  ) {
    const [linha] = await tx.insert(schema.filaEspera).values(entrada).returning();
    if (linha === undefined) throw new Error('Insert na fila nao devolveu linha.');
    return linha;
  },

  async mudarStatus(
    tx: Tx,
    id: string,
    status: 'esperando' | 'ofertado' | 'aceito' | 'expirado' | 'saiu',
  ) {
    await tx.update(schema.filaEspera).set({ status }).where(eq(schema.filaEspera.id, id));
  },

  async registrarOferta(
    tx: Tx,
    id: string,
    oferta: { readonly inicio: Date; readonly expiraEm: Date; readonly em: Date },
  ) {
    await tx
      .update(schema.filaEspera)
      .set({
        status: 'ofertado',
        ofertadoEm: oferta.em,
        ofertaExpiraEm: oferta.expiraEm,
        ofertaInicio: oferta.inicio,
      })
      .where(eq(schema.filaEspera.id, id));
  },

  /**
   * Quem chegou sai da fila do MESMO servico e profissional — ja escolheu.
   * `recursoId` nulo na espera quer dizer qualquer, entao ela tambem sai.
   */
  async sairPorEscolha(
    tx: Tx,
    entrada: {
      readonly clienteId: string;
      readonly servicoId: string;
      readonly recursoId: string | null;
    },
  ): Promise<number> {
    const linhas = await tx
      .update(schema.filaEspera)
      .set({ status: 'saiu' })
      .where(
        and(
          eq(schema.filaEspera.clienteId, entrada.clienteId),
          eq(schema.filaEspera.servicoId, entrada.servicoId),
          inArray(schema.filaEspera.status, ['esperando', 'ofertado']),
          entrada.recursoId === null
            ? undefined
            : or(
                isNull(schema.filaEspera.recursoId),
                eq(schema.filaEspera.recursoId, entrada.recursoId),
              ),
        ),
      )
      .returning({ id: schema.filaEspera.id });

    return linhas.length;
  },
};
