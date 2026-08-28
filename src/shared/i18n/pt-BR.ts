/**
 * TODO texto de interface mora aqui. Nenhuma string literal em componente.
 *
 * O back devolve um CÓDIGO. O texto nasce neste arquivo. É o que permite
 * mudar a palavra sem mexer em regra de negócio — e traduzir sem caçar aspas.
 */

export const textos = {
  app: {
    nome: 'Kairo',
    descricao: 'Agenda, atendimento e cobrança para quem vive de consulta.',
  },

  nav: {
    hoje: 'Hoje',
    agenda: 'Agenda',
    clientes: 'Clientes',
    conversas: 'Conversas',
    financeiro: 'Financeiro',
    automacoes: 'Automações',
    conta: 'Conta',
    mais: 'Mais',
    abrirMenu: 'Abrir menu',
    fecharMenu: 'Fechar menu',
  },

  acoes: {
    novoAgendamento: 'Novo agendamento',
    confirmar: 'Confirmar',
    cancelar: 'Cancelar',
    remarcar: 'Remarcar',
    bloquear: 'Bloquear horário',
    chegou: 'Chegou',
    salvar: 'Salvar',
    desfazer: 'Desfazer',
    fechar: 'Fechar',
    tentarNovamente: 'Tentar novamente',
  },

  estados: {
    carregando: 'Carregando…',
    vazioAgenda: 'Nenhum horário marcado para este dia.',
    vazioAgendaAcao: 'Toque em “Novo agendamento” para começar.',
    vazioClientes: 'Nenhum cliente cadastrado ainda.',
    erroGenerico: 'Alguma coisa não funcionou aqui.',
    erroGenericoAcao: 'Tente de novo. Se continuar, fale com o suporte.',
    semConexao: 'Sem conexão. As alterações vão ser enviadas quando a internet voltar.',
    canalDesconectado: 'O canal de mensagens está desconectado.',
    canalDesconectadoAcao: 'Reconectar em Conta › Canal',
  },

  agenda: {
    tituloDia: 'Agenda do dia',
    horarioLivre: 'Livre',
    horarioOcupado: 'Ocupado',
    agora: 'Agora',
    duracao: 'Duração',
    servico: 'Serviço',
    cliente: 'Cliente',
    inicio: 'Início',
  },

  /**
   * Todo erro tem TRÊS textos: o que aconteceu, por quê, e o que fazer agora.
   * "Não foi possível concluir" não é mensagem; é desistência.
   */
  erros: {
    HORARIO_OCUPADO: {
      titulo: 'Esse horário já está ocupado',
      explicacao: 'Outro atendimento foi marcado no mesmo intervalo.',
      acao: 'Escolha um dos horários livres mais próximos.',
    },
    FORA_DA_JORNADA: {
      titulo: 'Fora do horário de atendimento',
      explicacao: 'O horário escolhido está fora da jornada configurada para esse dia.',
      acao: 'Ajuste a jornada em Conta › Horários ou escolha outro horário.',
    },
    ANTECEDENCIA_INSUFICIENTE: {
      titulo: 'Muito em cima da hora',
      explicacao: 'Este serviço exige uma antecedência mínima para ser marcado.',
      acao: 'Escolha um horário mais adiante, ou marque manualmente pela agenda.',
    },
    AGENDAMENTO_NAO_ENCONTRADO: {
      titulo: 'Agendamento não encontrado',
      explicacao: 'Ele pode ter sido cancelado ou removido por outra pessoa.',
      acao: 'Atualize a agenda para ver a lista mais recente.',
    },
    CONFLITO_DE_VERSAO: {
      titulo: 'Alguém alterou antes de você',
      explicacao: 'Este agendamento mudou enquanto a tela estava aberta.',
      acao: 'Atualize e refaça a alteração.',
    },
    TRANSICAO_INVALIDA: {
      titulo: 'Essa mudança não é possível agora',
      explicacao: 'O agendamento está num estado que não permite esta ação.',
      acao: 'Atualize a tela para ver a situação atual.',
    },
    NAO_AUTENTICADO: {
      titulo: 'Sua sessão expirou',
      explicacao: 'Por segurança, a sessão termina depois de um tempo parado.',
      acao: 'Entre de novo para continuar.',
    },
    NAO_AUTORIZADO: {
      titulo: 'Sem permissão',
      explicacao: 'Seu perfil não alcança esta parte do sistema.',
      acao: 'Peça acesso a quem administra a conta.',
    },
    DADOS_INVALIDOS: {
      titulo: 'Faltou alguma informação',
      explicacao: 'Um ou mais campos não foram preenchidos como o sistema espera.',
      acao: 'Revise os campos destacados e envie de novo.',
    },
    ERRO_INTERNO: {
      titulo: 'Alguma coisa não funcionou aqui',
      explicacao: 'A falha foi registrada e já está visível para o suporte.',
      acao: 'Tente de novo em instantes.',
    },
  },
} as const;

export type Textos = typeof textos;
export type CodigoErro = keyof Textos['erros'];

export type TextoDeErro = {
  readonly titulo: string;
  readonly explicacao: string;
  readonly acao: string;
};

/** Traduz um código de erro do back nos três textos da interface. */
export function traduzirErro(codigo: string): TextoDeErro {
  const conhecido = (textos.erros as Record<string, TextoDeErro | undefined>)[codigo];
  return conhecido ?? textos.erros.ERRO_INTERNO;
}
