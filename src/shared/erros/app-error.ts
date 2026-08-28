/**
 * Exceção de infraestrutura. Erro de negócio não passa por aqui — ver resultado.ts.
 */
export class AppError extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly contexto: Record<string, unknown>;

  constructor(
    codigo: string,
    mensagem: string,
    opcoes: { status?: number; contexto?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(mensagem, opcoes.cause === undefined ? undefined : { cause: opcoes.cause });
    this.name = 'AppError';
    this.codigo = codigo;
    this.status = opcoes.status ?? 500;
    this.contexto = opcoes.contexto ?? {};
  }
}

export class NaoAutenticado extends AppError {
  constructor() {
    super('NAO_AUTENTICADO', 'Sessão ausente ou expirada.', { status: 401 });
    this.name = 'NaoAutenticado';
  }
}

export class NaoAutorizado extends AppError {
  constructor(recurso: string) {
    super('NAO_AUTORIZADO', `Sem permissão para ${recurso}.`, { status: 403 });
    this.name = 'NaoAutorizado';
  }
}

export class TenantAusente extends AppError {
  constructor() {
    super('TENANT_AUSENTE', 'Query executada fora de withTenant().', { status: 500 });
    this.name = 'TenantAusente';
  }
}
