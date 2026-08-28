import { textos } from '@/shared/i18n';

/**
 * Pagina publica: sem login, sem dado de cliente.
 *
 * Le a agenda por uma funcao `security definer` de escopo minimo, que devolve
 * so o horario livre — nunca nome de cliente, nunca observacao.
 *
 * Orcamento desta pagina: menos de 90 kB de JS comprimido.
 */
export const revalidate = 60;

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-[24px] font-semibold tracking-tight">{textos.app.nome}</h1>
      <p className="texto-bloco text-tinta-2 text-[15px]">{textos.app.descricao}</p>
      <p className="text-tinta-3 font-mono text-[13px]">/{slug}</p>
    </main>
  );
}
