import { brand } from '../config/brand';
import type { CodigoDeErro } from '../erros/dominio';

/**
 * TODO texto de interface mora aqui. Nenhuma string literal em componente.
 *
 * O back devolve um CÓDIGO. O texto nasce neste arquivo — é o que permite
 * mudar a palavra sem mexer em regra de negócio, e é o que permite ao agente
 * falar com o cliente final sem repetir o texto do painel.
 *
 * A voz muda conforme com quem se fala:
 *   profissional  → direta, específica, sem bajulação
 *   cliente final → cordial, breve, no ritmo do WhatsApp
 */

export const textos = {
  app: {
    nome: brand.name,
    descricao: brand.tagline,
    descritor: brand.descriptor,
  },

  nav: {
    hoje: 'Hoje',
    agenda: 'Agenda',
    clientes: 'Clientes',
    conversas: 'Conversas',
    servicos: 'Serviços',
    financeiro: 'Financeiro',
    automacoes: 'Automações',
    conta: 'Conta',
    mais: 'Mais',
    abrirMenu: 'Abrir menu',
    fecharMenu: 'Fechar menu',
    irParaConteudo: 'Ir para o conteúdo',
  },

  acoes: {
    novoAgendamento: 'Novo agendamento',
    maisAcoes: 'Mais ações',
    marcar: 'Marcar',
    confirmar: 'Confirmar',
    cancelar: 'Cancelar',
    remarcar: 'Remarcar',
    bloquear: 'Bloquear horário',
    chegou: 'Chegou',
    registrarPagamento: 'Registrar pagamento',
    marcarFalta: 'Marcar falta',
    salvar: 'Salvar',
    desfazer: 'Desfazer',
    fechar: 'Fechar',
    tentarNovamente: 'Tentar de novo',
    voltar: 'Voltar',
  },

  estados: {
    carregando: 'Carregando…',
    vazioAgenda: 'Nenhum horário marcado para este dia.',
    vazioAgendaAcao: 'Toque em “Novo agendamento” para começar.',
    vazioClientes: 'Nenhum cliente cadastrado ainda.',
    vazioClientesAcao: 'Quem marcar pelo link entra aqui sozinho.',
    vazioConversas: 'Nenhuma conversa por enquanto.',
    vazioConversasAcao: 'Quando alguém escrever no WhatsApp, aparece aqui.',
    vazioServicos: 'Nenhum serviço cadastrado.',
    vazioServicosAcao: 'Cadastre o que você faz para poder marcar.',
    vazioFinanceiro: 'Nada recebido neste mês ainda.',
    vazioFinanceiroAcao: 'Pagamentos registrados aparecem aqui.',
    erroGenerico: 'Alguma coisa não funcionou aqui.',
    erroGenericoAcao: 'Tente de novo. Se continuar, me escreva.',
    /* Vivem no fluxo, nunca sobrepostas: empurram o conteúdo em vez de cobri-lo. */
    semConexao: 'Sem conexão. Vou salvar quando a internet voltar.',
    mostrandoOQueJaEstavaAqui: 'Sem conexão — mostrando o que já estava aqui.',
    canalDesconectado: 'O atendimento automático está desligado: WhatsApp desconectado.',
    canalDesconectadoAcao: 'Conectar em Conta › Canal',
  },

  agenda: {
    tituloDia: 'Agenda do dia',
    tituloSemana: 'Semana',
    horarioLivre: 'Livre',
    horarioOcupado: 'Ocupado',
    agora: 'Agora',
    duracao: 'Duração',
    /* Rótulos de uma palavra: a tela mais repetida do dia é quase muda. */
    quem: 'Quem',
    oQue: 'O quê',
    quando: 'Quando',
    recentes: 'Recentes',
    maisUsados: 'Mais usados',
    semHorarioLivre: 'Sem horário livre neste dia.',
    semHorarioLivreAcao: 'Escolha outro dia ou ajuste a jornada em Conta › Horários.',
    rascunhoPerdido: 'O rascunho não foi salvo — o app fechou antes.',
  },

  status: {
    pendente: 'Aguardando',
    confirmado: 'Confirmado',
    chegou: 'Chegou',
    atendido: 'Atendido',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  },

  publico: {
    escolhaServico: 'O que você quer marcar?',
    escolhaDia: 'Que dia fica bom?',
    escolhaHorario: 'Que horas?',
    semHorarioNaSemana: 'Sem horários nesta semana',
    entrarNaFila: 'Entrar na fila de espera',
    encarregado: 'Dúvidas sobre seus dados: ',
  },
} as const;

export type Textos = typeof textos;

/**
 * Os TRÊS textos de cada erro.
 *
 * `clienteFinal` é o que o agente diz no WhatsApp — por isso não fala de
 * "sistema", "registro" nem "operação".
 */
export type TextoDeErro = {
  readonly profissional: string;
  readonly clienteFinal: string;
  readonly acaoSugerida: string;
};

const ERROS: Readonly<Record<CodigoDeErro, TextoDeErro>> = {
  HORARIO_OCUPADO: {
    profissional: 'Esse horário já está ocupado.',
    clienteFinal: 'Esse horário acabou de ser pego.',
    acaoSugerida: 'Escolha um dos horários livres mais próximos.',
  },
  FORA_DO_EXPEDIENTE: {
    profissional: 'Esse horário está fora da sua jornada.',
    clienteFinal: 'Nesse horário não tem atendimento.',
    acaoSugerida: 'Ajuste a jornada em Conta › Horários ou escolha outro horário.',
  },
  ANTECEDENCIA_INSUFICIENTE: {
    profissional: 'Esse serviço exige antecedência mínima para ser marcado.',
    clienteFinal: 'Esse horário já está muito em cima da hora.',
    acaoSugerida: 'Escolha um horário mais adiante.',
  },
  SERVICO_INATIVO: {
    profissional: 'Esse serviço está desativado.',
    clienteFinal: 'Esse serviço não está disponível agora.',
    acaoSugerida: 'Reative em Serviços, ou escolha outro.',
  },
  CANAL_DESCONECTADO: {
    profissional: 'O WhatsApp está desconectado — nada automático sai enquanto isso.',
    clienteFinal: 'Vou chamar alguém para te responder.',
    acaoSugerida: 'Reconectar em Conta › Canal.',
  },
  LIMITE_PLANO: {
    profissional: 'Você chegou ao limite do seu plano para esse recurso.',
    clienteFinal: 'Vou chamar alguém para te responder.',
    acaoSugerida: 'Veja os planos em Conta › Assinatura.',
  },
  CONSENTIMENTO_AUSENTE: {
    profissional: 'Falta o consentimento desse cliente para essa finalidade.',
    clienteFinal: 'Preciso da sua autorização antes de seguir.',
    acaoSugerida: 'Peça o consentimento pelo link da ficha.',
  },
  AGENDAMENTO_NAO_ENCONTRADO: {
    profissional: 'Esse agendamento não existe mais.',
    clienteFinal: 'Não encontrei esse horário.',
    acaoSugerida: 'Atualize a agenda para ver a lista mais recente.',
  },
  CONFLITO_DE_VERSAO: {
    profissional: 'Esse agendamento mudou enquanto a tela estava aberta.',
    clienteFinal: 'Esse horário mudou agora há pouco.',
    acaoSugerida: 'Atualize e refaça a alteração.',
  },
  TRANSICAO_INVALIDA: {
    profissional: 'O agendamento está num estado que não permite essa ação.',
    clienteFinal: 'Não consigo fazer isso com esse horário.',
    acaoSugerida: 'Atualize a tela para ver a situação atual.',
  },
  DADOS_INVALIDOS: {
    profissional: 'Faltou alguma informação.',
    clienteFinal: 'Não entendi direito — pode repetir?',
    acaoSugerida: 'Revise os campos destacados e envie de novo.',
  },
};

/** Fallback honesto: erro desconhecido também diz o que fazer. */
const ERRO_DESCONHECIDO: TextoDeErro = {
  profissional: 'Alguma coisa não funcionou aqui.',
  clienteFinal: 'Deu um problema aqui do meu lado.',
  acaoSugerida: 'Tente de novo em instantes.',
};

export function traduzirErro(codigo: string): TextoDeErro {
  return (ERROS as Record<string, TextoDeErro | undefined>)[codigo] ?? ERRO_DESCONHECIDO;
}
