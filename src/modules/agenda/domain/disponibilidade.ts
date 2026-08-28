/**
 * A peça mais difícil do produto — e por isso ela é uma função pura.
 *
 * Não conhece banco, não conhece HTTP, não conhece React. Recebe a jornada, os
 * horários ocupados e o serviço; devolve os slots livres. É testável sem mock,
 * sem container e sem esperar 40 segundos por um Postgres subir.
 */

export type Intervalo = {
  readonly inicio: Date;
  readonly fim: Date;
};

export type ParametrosDeDisponibilidade = {
  /** Janelas de trabalho do dia, já resolvidas no fuso do profissional. */
  readonly jornada: readonly Intervalo[];
  /** Agendamentos e bloqueios que ocupam a agenda. */
  readonly ocupados: readonly Intervalo[];
  /** Duração do serviço, em minutos. */
  readonly duracaoMin: number;
  /** Folga obrigatória antes e depois de cada atendimento. */
  readonly intervaloMin?: number;
  /** Granularidade da grade de horários. */
  readonly passoMin?: number;
  /** Antecedência mínima para marcar. */
  readonly antecedenciaMinimaMin?: number;
  /** O "agora" entra por parâmetro: a função não lê o relógio do sistema. */
  readonly agora: Date;
};

export type Disponibilidade = {
  readonly slots: readonly Intervalo[];
  /** O horário pedido está livre? Comparação exata de início. */
  readonly contem: (inicio: Date) => boolean;
  /** Os três livres mais próximos de uma referência — a ação sugerida do erro. */
  readonly tresProximos: (referencia: Date) => readonly Intervalo[];
};

const MINUTO = 60_000;

function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fim.getTime() && b.inicio.getTime() < a.fim.getTime();
}

function expandir(i: Intervalo, folgaMin: number): Intervalo {
  if (folgaMin <= 0) return i;
  return {
    inicio: new Date(i.inicio.getTime() - folgaMin * MINUTO),
    fim: new Date(i.fim.getTime() + folgaMin * MINUTO),
  };
}

export function slotsLivres(p: ParametrosDeDisponibilidade): Disponibilidade {
  const duracao = p.duracaoMin * MINUTO;
  const passo = (p.passoMin ?? 15) * MINUTO;
  const folga = p.intervaloMin ?? 0;
  const naoAntesDe = p.agora.getTime() + (p.antecedenciaMinimaMin ?? 0) * MINUTO;

  if (p.duracaoMin <= 0 || passo <= 0) return criar([]);

  const bloqueados = p.ocupados.map((o) => expandir(o, folga));
  const livres: Intervalo[] = [];

  for (const janela of p.jornada) {
    const limite = janela.fim.getTime();
    for (let t = janela.inicio.getTime(); t + duracao <= limite; t += passo) {
      if (t < naoAntesDe) continue;

      const candidato: Intervalo = { inicio: new Date(t), fim: new Date(t + duracao) };
      if (bloqueados.some((b) => sobrepoe(candidato, b))) continue;

      livres.push(candidato);
    }
  }

  livres.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  return criar(livres);
}

function criar(slots: readonly Intervalo[]): Disponibilidade {
  const porInicio = new Set(slots.map((s) => s.inicio.getTime()));

  return {
    slots,
    contem: (inicio) => porInicio.has(inicio.getTime()),
    tresProximos: (referencia) => {
      const alvo = referencia.getTime();
      return [...slots]
        .sort((a, b) => Math.abs(a.inicio.getTime() - alvo) - Math.abs(b.inicio.getTime() - alvo))
        .slice(0, 3)
        .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    },
  };
}
