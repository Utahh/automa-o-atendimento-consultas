import { redirect } from 'next/navigation';
import { textos } from '@/shared/i18n';
import { Simbolo } from '@/shared/ui/primitives/Logo';
import { sessaoAtual } from '@/shared/tenancy/sessao';
import { FormularioDeEntrada } from '@/modules/auth/ui/FormularioDeEntrada';

export const metadata = { title: textos.entrar.titulo };
export const dynamic = 'force-dynamic';

export default async function Entrar() {
  // Quem ja esta dentro nao ve a porta.
  if ((await sessaoAtual()) !== null) redirect('/hoje');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <span className="text-brand">
          <Simbolo tamanho={32} />
        </span>
        <h1 className="titulo-tela">{textos.entrar.titulo}</h1>
      </header>

      <FormularioDeEntrada />
    </main>
  );
}
