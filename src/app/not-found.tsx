import { textos } from '@/shared/i18n';
import { Simbolo } from '@/shared/ui/primitives/Logo';

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-brand">
        <Simbolo tamanho={32} />
      </span>
      <h1 className="titulo-tela">{textos.estados.erroGenerico}</h1>
      <p className="texto-bloco text-fg-muted text-base">{textos.estados.erroGenericoAcao}</p>
    </main>
  );
}
