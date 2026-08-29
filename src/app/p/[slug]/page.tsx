import { brand } from '@/shared/config/brand';
import { textos } from '@/shared/i18n';
// Import direto, sem passar pelo barril: o barril arrasta os componentes de
// cliente da casca para o grafo desta rota, e ela e a de orcamento mais
// apertado do produto.
import { Logo } from '@/shared/ui/primitives/Logo';

/**
 * A unica tela que o cliente final ve.
 *
 * Sem login, sem dado de outro cliente: le a agenda por uma funcao
 * `security definer` de escopo minimo, que devolve so o horario ocupado —
 * nunca nome, nunca observacao.
 *
 * Tres decisoes: servico, dia, horario. Nome e telefone so se for cliente novo.
 * Orcamento desta rota: o mais apertado do produto.
 *
 * A pagina quase nao fala. O unico texto de personalidade e o nome da
 * profissional no topo — e o rodape traz o e-mail do encarregado, porque o
 * titular dos dados precisa ter a quem recorrer sem passar pela profissional.
 */
export const revalidate = 60;

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <span className="text-brand">
          <Logo altura={26} />
        </span>
        <p className="text-fg-muted font-mono text-sm">/{slug}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h1 className="titulo-tela">{textos.publico.escolhaServico}</h1>
        <p className="texto-bloco text-fg-muted text-base">{textos.publico.semHorarioNaSemana}</p>
      </section>

      <footer className="text-fg-muted mt-auto pt-8 text-sm">
        <span className="texto-bloco">
          {textos.publico.encarregado}
          <a href={'mailto:' + brand.supportEmail} className="underline underline-offset-2">
            {brand.supportEmail}
          </a>
        </span>
      </footer>
    </main>
  );
}
