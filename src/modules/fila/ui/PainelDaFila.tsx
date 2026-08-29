import { textos } from '@/shared/i18n';
import { Card, List, Stack } from '@/shared/ui';
import type { EsperaNaTela } from '../consultas';

/**
 * A fila pelo lado de quem atende: demanda reprimida, por dia e por faixa.
 *
 * Server Component: e leitura pura, e nao precisa de nenhum JavaScript no
 * celular para existir.
 */
export function PainelDaFila({ esperas }: { readonly esperas: readonly EsperaNaTela[] }) {
  if (esperas.length === 0) {
    return (
      <Card>
        <Card.Body>
          <p className="texto-bloco text-fg-muted text-sm">{textos.fila.vazia}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Stack espaco={2}>
      <h2 className="rotulo text-fg-muted">
        {textos.fila.titulo + ' · ' + String(esperas.length)}
      </h2>
      <List rotulo={textos.fila.titulo}>
        {esperas.map((e) => (
          <List.Item key={e.id}>
            <div className="flex min-w-0 flex-1 basis-40 flex-col">
              <span className="texto-linha text-base font-medium">{e.dia}</span>
              <span className="texto-linha text-fg-muted text-sm">{e.faixa}</span>
            </div>
            {e.ofertaAte === null ? null : (
              <span className="text-warning shrink-0 text-sm">
                {textos.fila.ofertadoAte + e.ofertaAte}
              </span>
            )}
          </List.Item>
        ))}
      </List>
    </Stack>
  );
}
