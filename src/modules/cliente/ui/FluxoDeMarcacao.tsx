'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Cluster, EmptyState, Stack, useToast } from '@/shared/ui';
import { textos, traduzirErro } from '@/shared/i18n';
import { entrarNaFilaAction, marcarAction } from '../actions';
import type { DiaComVaga, ProfissionalNoDia, ServicoDoCatalogo } from '../consultas';

/**
 * Serviço → dia → profissional → horário.
 *
 * Uma pergunta por tela, sem barra de progresso. O dia vem antes do
 * profissional de propósito: quem escolhe o profissional primeiro descobre
 * depois que ele não tem vaga, e recomeça.
 *
 * Quando o dia não tem ninguém livre, a tela não é um beco: ela oferece a fila
 * daquele dia ali mesmo.
 */

type Etapa = 'servico' | 'dia' | 'profissional';

export function FluxoDeMarcacao({
  servicos,
  buscarDias,
  buscarProfissionais,
}: {
  readonly servicos: readonly ServicoDoCatalogo[];
  readonly buscarDias: (servicoId: string) => Promise<readonly DiaComVaga[]>;
  readonly buscarProfissionais: (
    servicoId: string,
    diaISO: string,
  ) => Promise<readonly ProfissionalNoDia[]>;
}) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [pendente, iniciar] = useTransition();

  const [etapa, setEtapa] = useState<Etapa>('servico');
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [diaISO, setDiaISO] = useState<string | null>(null);
  const [dias, setDias] = useState<readonly DiaComVaga[]>([]);
  const [profissionais, setProfissionais] = useState<readonly ProfissionalNoDia[]>([]);
  const [erroDaTela, setErroDaTela] = useState<string | null>(null);

  function escolherServico(id: string) {
    setServicoId(id);
    setErroDaTela(null);
    iniciar(async () => {
      setDias(await buscarDias(id));
      setEtapa('dia');
    });
  }

  function escolherDia(iso: string) {
    if (servicoId === null) return;
    setDiaISO(iso);
    setErroDaTela(null);
    iniciar(async () => {
      setProfissionais(await buscarProfissionais(servicoId, iso));
      setEtapa('profissional');
    });
  }

  function marcar(recursoId: string, inicioISO: string) {
    if (servicoId === null) return;
    iniciar(async () => {
      const r = await marcarAction({ servicoId, recursoId, inicio: inicioISO });
      if (r.ok) {
        mostrar(textos.cliente.marcado);
        router.push('/cliente');
        return;
      }
      const t = traduzirErro(r.erro.codigo);
      setErroDaTela(t.clienteFinal + ' ' + t.acaoSugerida);
      // O horário sumiu entre a escolha e o toque: recarrega quem ainda tem vaga.
      setProfissionais(await buscarProfissionais(servicoId, diaISO ?? ''));
    });
  }

  function entrarNaFila() {
    if (servicoId === null || diaISO === null) return;
    iniciar(async () => {
      const r = await entrarNaFilaAction({
        servicoId,
        recursoId: null,
        dia: diaISO,
        faixa: 'qualquer',
        agendamentoAtualId: null,
      });
      if (r.ok) {
        mostrar(textos.cliente.naFila);
        router.push('/cliente');
      }
    });
  }

  if (etapa === 'servico') {
    return (
      <Stack espaco={4}>
        <h2 className="titulo-tela">{textos.cliente.escolhaServico}</h2>
        <Stack espaco={2}>
          {servicos.map((s) => (
            <Card key={s.id}>
              <button
                type="button"
                onClick={() => escolherServico(s.id)}
                disabled={pendente}
                className="alvo-toque flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="texto-linha min-w-0 flex-1 font-medium">{s.nome}</span>
                <span className="text-fg-muted shrink-0 font-mono text-sm tabular-nums">
                  {formatarPreco(s.precoCentavos)}
                </span>
              </button>
            </Card>
          ))}
        </Stack>
      </Stack>
    );
  }

  if (etapa === 'dia') {
    return (
      <Stack espaco={4}>
        <h2 className="titulo-tela">{textos.cliente.escolhaDia}</h2>
        {dias.length === 0 ? (
          <EmptyState
            titulo={textos.agenda.semHorarioLivre}
            acao={textos.agenda.semHorarioLivreAcao}
          />
        ) : (
          <Stack espaco={2}>
            {dias.map((d) => (
              <Card key={d.iso}>
                <button
                  type="button"
                  onClick={() => escolherDia(d.iso)}
                  disabled={pendente}
                  className="alvo-toque flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="texto-linha min-w-0 flex-1">{d.rotulo}</span>
                  <span className="text-fg-muted shrink-0 text-sm tabular-nums">
                    {String(d.vagas) +
                      (d.vagas === 1 ? textos.cliente.umaVaga : textos.cliente.vagas)}
                  </span>
                </button>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Stack espaco={4}>
      <h2 className="titulo-tela">{textos.cliente.escolhaProfissional}</h2>

      {erroDaTela !== null ? (
        <p role="alert" className="texto-bloco text-danger text-sm">
          {erroDaTela}
        </p>
      ) : null}

      {profissionais.length === 0 ? (
        <Stack espaco={3}>
          <EmptyState
            titulo={textos.cliente.semProfissional}
            acao={textos.cliente.semProfissionalAcao}
          />
          <Button largo variante="secundario" onClick={entrarNaFila} disabled={pendente}>
            {textos.cliente.entrarNaFila}
          </Button>
          <p className="texto-bloco text-fg-muted text-sm">{textos.cliente.explicacaoDaFila}</p>
        </Stack>
      ) : (
        <Stack espaco={4}>
          {profissionais.map((p) => (
            <Stack espaco={2} key={p.id}>
              <h3 className="text-base font-medium">{p.nome}</h3>
              <Cluster>
                {p.horarios.map((h) => (
                  <Chip
                    key={h.inicioISO}
                    rotulo={h.horaFormatada}
                    aoEscolher={() => marcar(p.id, h.inicioISO)}
                  />
                ))}
              </Cluster>
            </Stack>
          ))}
        </Stack>
      )}

      <Button largo variante="fantasma" onClick={() => setEtapa('dia')} disabled={pendente}>
        {textos.cliente.voltarParaOsDias}
      </Button>
    </Stack>
  );
}

function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    centavos / 100,
  );
}
