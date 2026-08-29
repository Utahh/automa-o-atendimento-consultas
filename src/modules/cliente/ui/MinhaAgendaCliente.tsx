'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, List, Stack, StatusBadge, EmptyState, useToast } from '@/shared/ui';
import { textos, traduzirErro } from '@/shared/i18n';
import type { EstadoVisual } from '@/shared/ui';
import { checkinAction, sairDaFilaAction } from '../actions';
import type { MinhaAgenda } from '../consultas';

/**
 * A casa do cliente: o próximo horário, a fila e um botão.
 *
 * Não é um painel; é uma resposta. Por isso o botão de check-in só aparece
 * quando ele significa alguma coisa — e quando não aparece, a tela diz a que
 * horas ele abre, em vez de deixar a pessoa adivinhando.
 */
export function MinhaAgendaCliente({ agenda }: { readonly agenda: MinhaAgenda }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [pendente, iniciar] = useTransition();

  function chegar(id: string) {
    iniciar(async () => {
      const r = await checkinAction(id);
      mostrar(r.ok ? textos.cliente.chegouOk : traduzirErro(r.erro.codigo).clienteFinal);
      router.refresh();
    });
  }

  function sair(id: string) {
    iniciar(async () => {
      await sairDaFilaAction(id);
      router.refresh();
    });
  }

  return (
    <Stack espaco={6}>
      <Stack espaco={3}>
        <h2 className="rotulo text-fg-muted">{textos.cliente.proximo}</h2>

        {agenda.agendamentos.length === 0 ? (
          <EmptyState titulo={textos.cliente.semHorario} acao={textos.cliente.semHorarioAcao} />
        ) : (
          <List rotulo={textos.cliente.titulo}>
            {agenda.agendamentos.map((a) => (
              <List.Item key={a.id}>
                <div className="flex min-w-0 flex-1 basis-40 flex-col">
                  <span className="texto-linha text-base font-medium">{a.servicoNome}</span>
                  <span className="texto-linha text-fg-muted text-sm">{a.quando}</span>
                </div>
                <StatusBadge estado={a.status as EstadoVisual} />
                {a.podeCheckin ? (
                  <Button onClick={() => chegar(a.id)} disabled={pendente}>
                    {textos.cliente.cheguei}
                  </Button>
                ) : (
                  <span className="text-fg-muted shrink-0 text-sm">
                    {textos.cliente.checkinAbreAs + a.checkinAbreEm}
                  </span>
                )}
              </List.Item>
            ))}
          </List>
        )}

        <Button largo onClick={() => router.push('/cliente/marcar')}>
          {textos.cliente.marcar}
        </Button>
      </Stack>

      <Stack espaco={3}>
        <h2 className="rotulo text-fg-muted">{textos.cliente.naFila}</h2>

        {agenda.esperas.length === 0 ? (
          <Card>
            <Card.Body>
              <p className="texto-bloco text-fg-muted text-sm">{textos.cliente.semFila}</p>
            </Card.Body>
          </Card>
        ) : (
          <List rotulo={textos.cliente.naFila}>
            {agenda.esperas.map((e) => (
              <List.Item key={e.id}>
                <div className="flex min-w-0 flex-1 basis-40 flex-col">
                  <span className="texto-linha text-base font-medium">{e.rotulo}</span>
                  <span className="texto-linha text-fg-muted text-sm">
                    {e.ofertaAte === null
                      ? textos.cliente.posicaoNaFila +
                        String(e.posicao) +
                        textos.cliente.posicaoNaFilaFim
                      : textos.cliente.ofertaAte + e.ofertaAte}
                  </span>
                </div>
                <Button variante="fantasma" onClick={() => sair(e.id)} disabled={pendente}>
                  {textos.cliente.sairDaFila}
                </Button>
              </List.Item>
            ))}
          </List>
        )}

        <p className="texto-bloco text-fg-muted text-sm">{textos.cliente.explicacaoDaFila}</p>
      </Stack>
    </Stack>
  );
}
