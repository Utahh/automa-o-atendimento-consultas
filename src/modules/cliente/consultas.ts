import 'server-only';
import { withCliente } from '@/shared/db';
import { exigirSessaoDeCliente } from '@/shared/tenancy/sessao';
import { slotsLivres, type Intervalo } from '@/modules/agenda';
import { formatarDia, formatarHora, janelasDoDia } from '@/modules/agenda';
import { agendamentoRepo } from '@/modules/agenda/infra/agendamento.repo';
import { filaRepo } from '@/modules/fila';
import { posicaoNaFila } from '@/modules/fila';
import { podeFazerCheckin } from '@/modules/agenda/domain/checkin';

/**
 * A porta de LEITURA do app do cliente.
 *
 * Toda consulta aqui passa por `withCliente()`: o banco filtra pelo cliente da
 * sessão antes de a consulta existir. Catálogo ele lê inteiro — precisa dele
 * para escolher; agendamento, fila e avaliação, só as linhas dele.
 */

const DIAS_A_MOSTRAR = 14;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

export type ServicoDoCatalogo = {
  readonly id: string;
  readonly nome: string;
  readonly duracaoMin: number;
  readonly precoCentavos: number;
};

export type DiaComVaga = {
  readonly iso: string;
  readonly rotulo: string;
  readonly vagas: number;
};

export type ProfissionalNoDia = {
  readonly id: string;
  readonly nome: string;
  readonly horarios: readonly { readonly inicioISO: string; readonly horaFormatada: string }[];
};

export type MeuAgendamento = {
  readonly id: string;
  readonly quando: string;
  readonly servicoNome: string;
  readonly clienteNome: string;
  readonly status: string;
  readonly podeCheckin: boolean;
  readonly checkinAbreEm: string;
};

export type MinhaEspera = {
  readonly id: string;
  readonly rotulo: string;
  readonly posicao: number;
  readonly ofertaAte: string | null;
};

export async function catalogo(): Promise<readonly ServicoDoCatalogo[]> {
  const sessao = await exigirSessaoDeCliente();
  return withCliente(sessao.tenantId, sessao.clienteId, async (tx) => {
    const servicos = await agendamentoRepo.servicosDoCatalogo(tx);
    return servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      duracaoMin: s.duracaoMin,
      precoCentavos: s.precoCentavos,
    }));
  });
}

/**
 * O dia vem ANTES do profissional de propósito: a pergunta que o cliente sabe
 * responder é "quando eu posso ir". Perguntar primeiro o que ele sabe reduz o
 * número de becos sem saída.
 */
export async function diasComVaga(servicoId: string): Promise<readonly DiaComVaga[]> {
  const sessao = await exigirSessaoDeCliente();
  const agora = new Date();

  return withCliente(sessao.tenantId, sessao.clienteId, async (tx) => {
    const servico = await agendamentoRepo.servico(tx, servicoId);
    if (servico === null) return [];

    const inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio.getTime() + DIAS_A_MOSTRAR * UM_DIA_MS);

    const faixas = await agendamentoRepo.jornada(tx, null);
    const ocupados = await agendamentoRepo.ocupados(tx, inicio, fim);
    const janelas = await agendamentoRepo.janelas(tx, inicio, fim);

    const dias: DiaComVaga[] = [];
    for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
      const dia = new Date(inicio.getTime() + i * UM_DIA_MS);
      const jornada = [
        ...janelasDoDia(faixas, dia, sessao.fuso),
        ...janelasDoDiaExtra(janelas, dia),
      ];
      if (jornada.length === 0) continue;

      const livres = slotsLivres({
        jornada,
        ocupados,
        duracaoMin: servico.duracaoMin,
        intervaloMin: servico.intervaloMin,
        antecedenciaMinimaMin: servico.antecedenciaMinimaMin,
        agora,
      }).slots;

      dias.push({
        iso: dia.toISOString(),
        rotulo: formatarDia(dia, sessao.fuso),
        vagas: livres.length,
      });
    }

    return dias;
  });
}

/** Quem atende este serviço neste dia, e a que horas cada um tem vaga. */
export async function profissionaisNoDia(
  servicoId: string,
  diaISO: string,
): Promise<readonly ProfissionalNoDia[]> {
  const sessao = await exigirSessaoDeCliente();
  const agora = new Date();
  const dia = new Date(diaISO);

  return withCliente(sessao.tenantId, sessao.clienteId, async (tx) => {
    const servico = await agendamentoRepo.servico(tx, servicoId);
    if (servico === null) return [];

    const doServico = await agendamentoRepo.profissionaisDoServico(tx, servicoId);
    // Serviço sem vínculo declarado é atendido por qualquer um: é o caso da
    // profissional que trabalha sozinha e nunca cadastrou "quem faz o quê".
    const profissionais =
      doServico.length > 0 ? doServico : await agendamentoRepo.recursosAtivos(tx);

    const inicioDoDia = new Date(dia);
    inicioDoDia.setHours(0, 0, 0, 0);
    const fimDoDia = new Date(inicioDoDia.getTime() + UM_DIA_MS);

    const ocupados = await agendamentoRepo.ocupados(tx, inicioDoDia, fimDoDia);
    const janelas = await agendamentoRepo.janelas(tx, inicioDoDia, fimDoDia);

    const resultado: ProfissionalNoDia[] = [];
    for (const p of profissionais) {
      const faixas = await agendamentoRepo.jornada(tx, p.id);
      const jornada = [
        ...janelasDoDia(faixas, dia, sessao.fuso),
        ...janelasDoDiaExtra(janelas, dia),
      ];
      if (jornada.length === 0) continue;

      const livres = slotsLivres({
        jornada,
        ocupados,
        duracaoMin: servico.duracaoMin,
        intervaloMin: servico.intervaloMin,
        antecedenciaMinimaMin: servico.antecedenciaMinimaMin,
        agora,
      }).slots;

      if (livres.length === 0) continue;

      resultado.push({
        id: p.id,
        nome: p.nome,
        horarios: livres.map((s) => ({
          inicioISO: s.inicio.toISOString(),
          horaFormatada: formatarHora(s.inicio, sessao.fuso),
        })),
      });
    }

    return resultado;
  });
}

export type MinhaAgenda = {
  readonly agendamentos: readonly MeuAgendamento[];
  readonly esperas: readonly MinhaEspera[];
};

export async function minhaAgenda(): Promise<MinhaAgenda> {
  const sessao = await exigirSessaoDeCliente();
  const agora = new Date();

  return withCliente(sessao.tenantId, sessao.clienteId, async (tx) => {
    const inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio.getTime() + 60 * UM_DIA_MS);

    const linhas = await agendamentoRepo.doPeriodo(tx, inicio, fim);
    const esperas = await filaRepo.doCliente(tx, sessao.clienteId);
    const todasAsEsperas = await filaRepo.esperando(tx, inicio, fim);

    return {
      agendamentos: linhas.map((l) => {
        const veredito = podeFazerCheckin({
          inicio: l.inicio,
          fim: l.fim,
          status: l.status,
          checkinEm: l.checkinEm,
          agora,
        });

        return {
          id: l.id,
          quando: formatarDia(l.inicio, sessao.fuso) + ' · ' + formatarHora(l.inicio, sessao.fuso),
          servicoNome: l.servicoNome,
          clienteNome: l.clienteNome,
          status: l.status,
          podeCheckin: veredito.pode,
          checkinAbreEm: formatarHora(veredito.abreEm, sessao.fuso),
        };
      }),
      esperas: esperas.map((e) => ({
        id: e.id,
        rotulo: formatarDia(e.dia, sessao.fuso),
        posicao: posicaoNaFila(todasAsEsperas, e.id, sessao.fuso),
        ofertaAte: e.ofertaExpiraEm === null ? null : formatarHora(e.ofertaExpiraEm, sessao.fuso),
      })),
    };
  });
}

/** As janelas que caem no dia pedido. Elas somam à jornada. */
function janelasDoDiaExtra(janelas: readonly Intervalo[], dia: Date): readonly Intervalo[] {
  const inicio = new Date(dia);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio.getTime() + UM_DIA_MS);

  return janelas.filter(
    (j) => j.inicio.getTime() < fim.getTime() && j.fim.getTime() > inicio.getTime(),
  );
}
