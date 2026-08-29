/**
 * Ids fixos do tenant de exemplo.
 *
 * Fixos de proposito: o preparo dos testes precisa de uma sessao valida antes
 * de o app subir, e adivinhar um uuid aleatorio exigiria consultar o banco no
 * meio da configuracao do Playwright.
 */
export const TENANT_DEMO = '00000000-0000-4000-8000-000000000001';
export const USUARIO_DEMO = '00000000-0000-4000-8000-000000000002';
export const EMAIL_DEMO = 'ana@exemplo.com';

/** A profissional que entra no sistema, e a cliente com conta (ADR-001). */
export const USUARIO_PROFISSIONAL = '00000000-0000-4000-8000-000000000003';
export const USUARIO_CLIENTE = '00000000-0000-4000-8000-000000000004';
export const EMAIL_PROFISSIONAL = 'bruna@exemplo.com';
export const EMAIL_CLIENTE = 'bia@exemplo.com';

/** A cliente com conta, para o preparo dos testes do app do cliente. */
export const CLIENTE_DEMO = '00000000-0000-4000-8000-000000000005';
