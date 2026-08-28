import { textos } from '@/shared/i18n';

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-[20px] font-semibold">{textos.estados.erroGenerico}</h1>
      <p className="texto-bloco text-tinta-2 text-[15px]">{textos.estados.erroGenericoAcao}</p>
    </main>
  );
}
