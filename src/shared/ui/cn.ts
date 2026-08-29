/** Junta classes ignorando falsos. Sem dependencia externa. */
export function cn(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ');
}
