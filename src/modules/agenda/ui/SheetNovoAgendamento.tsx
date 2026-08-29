'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Button,
  Chip,
  Cluster,
  EmptyState,
  Field,
  Input,
  Sheet,
  Stack,
  useOverlay,
  useToast,
} from '@/shared/ui';
import { textos, traduzirErro } from '@/shared/i18n';
import { criarAgendamentoAction } from '../actions';
import type { Slot } from '../schemas';

/**
 * A tela mais repetida do dia, e o teste real do sistema de layout.
 *
 * Três decisões e nada mais — **Quem · O quê · Quando** —, com rótulo de uma
 * palavra. Nenhum campo obrigatório além desses três: o telefone só é pedido
 * se o cliente for novo, e **depois** de marcar.
 *
 * Critério medido: 5 pessoas que nunca viram o produto, mediana ≤ 30 s,
 * nenhuma acima de 60 s, num Android de entrada.
 */

export const ID_NOVO_AGENDAMENTO = 'folha-novo-agendamento';

export type Opcao = { readonly id: string; readonly rotulo: string };

export function SheetNovoAgendamento({
  clientesRecentes,
  servicosMaisUsados,
  horariosLivres,
  diaDosHorarios = '',
}: {
  readonly clientesRecentes: readonly Opcao[];
  readonly servicosMaisUsados: readonly Opcao[];
  readonly horariosLivres: readonly Slot[];
  readonly diaDosHorarios?: string;
}) {
  const router = useRouter();
  const { fechar } = useOverlay();
  const { mostrar } = useToast();
  const [enviando, iniciar] = useTransition();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [inicioISO, setInicioISO] = useState<string | null>(null);
  const [erroDoCampo, setErroDoCampo] = useState<string | null>(null);

  const temQuem = clienteId !== null || nomeNovo.trim().length >= 2;
  const pronto = temQuem && servicoId !== null && inicioISO !== null;

  function marcar() {
    if (!pronto || servicoId === null || inicioISO === null) return;

    iniciar(async () => {
      const r = await criarAgendamentoAction({
        clienteId,
        clienteNovoNome: clienteId === null ? nomeNovo.trim() : null,
        servicoId,
        recursoId: null,
        inicio: inicioISO,
      });

      if (r.ok) {
        // Desfazer em vez de diálogo: confirmação por toast, nunca "tem certeza?".
        mostrar(textos.acoes.marcar + ' · ' + textos.status.pendente);
        setClienteId(null);
        setNomeNovo('');
        setInicioISO(null);
        setErroDoCampo(null);
        fechar(ID_NOVO_AGENDAMENTO);
        // A agenda atrás da folha é Server Component: o revalidatePath da
        // action já invalidou o cache, o refresh busca a versão nova.
        router.refresh();
        return;
      }

      // Horário ocupado vira erro NO CAMPO, com as alternativas ao lado —
      // não um alerta que apaga o que a pessoa já escolheu.
      const texto = traduzirErro(r.erro.codigo);
      setErroDoCampo(texto.profissional + ' ' + texto.acaoSugerida);
      if (r.erro.codigo === 'HORARIO_OCUPADO') setInicioISO(null);
    });
  }

  return (
    <Sheet
      id={ID_NOVO_AGENDAMENTO}
      titulo={textos.acoes.novoAgendamento}
      rodape={
        <Button largo disabled={!pronto || enviando} onClick={marcar}>
          {textos.acoes.marcar}
        </Button>
      }
    >
      <Stack espaco={4}>
        <Field rotulo={textos.agenda.quem} para="cliente" dica={textos.agenda.recentes}>
          <Cluster>
            {clientesRecentes.map((c) => (
              <Chip
                key={c.id}
                rotulo={c.rotulo}
                selecionado={clienteId === c.id}
                aoEscolher={() => {
                  setClienteId(c.id);
                  setNomeNovo('');
                }}
              />
            ))}
          </Cluster>
          <Input
            id="cliente"
            value={nomeNovo}
            onChange={(e) => {
              setNomeNovo(e.target.value);
              setClienteId(null);
            }}
            autoComplete="off"
          />
        </Field>

        <Field rotulo={textos.agenda.oQue} para="servico" dica={textos.agenda.maisUsados}>
          <Cluster>
            {servicosMaisUsados.map((s) => (
              <Chip
                key={s.id}
                rotulo={s.rotulo}
                selecionado={servicoId === s.id}
                aoEscolher={() => setServicoId(s.id)}
              />
            ))}
          </Cluster>
          <input id="servico" type="hidden" value={servicoId ?? ''} readOnly />
        </Field>

        <Field
          rotulo={textos.agenda.quando}
          para="horario"
          {...(diaDosHorarios !== ''
            ? { dica: textos.agenda.proximoDiaComVaga + diaDosHorarios }
            : {})}
          {...(erroDoCampo !== null ? { erro: erroDoCampo } : {})}
        >
          {horariosLivres.length === 0 ? (
            <EmptyState
              titulo={textos.agenda.semHorarioLivre}
              acao={textos.agenda.semHorarioLivreAcao}
            />
          ) : (
            <Cluster>
              {horariosLivres.map((h) => (
                <Chip
                  key={h.inicioISO}
                  rotulo={h.horaFormatada}
                  selecionado={inicioISO === h.inicioISO}
                  aoEscolher={() => {
                    setInicioISO(h.inicioISO);
                    setErroDoCampo(null);
                  }}
                />
              ))}
            </Cluster>
          )}
          <input id="horario" type="hidden" value={inicioISO ?? ''} readOnly />
        </Field>
      </Stack>
    </Sheet>
  );
}

/** O gatilho. Ação principal na metade inferior: alcance do polegar. */
export function BotaoNovoAgendamento({
  clientesRecentes = [],
  servicosMaisUsados = [],
  horariosLivres = [],
  diaDosHorarios = '',
}: {
  readonly clientesRecentes?: readonly Opcao[];
  readonly servicosMaisUsados?: readonly Opcao[];
  readonly horariosLivres?: readonly Slot[];
  readonly diaDosHorarios?: string;
}) {
  const { abrir } = useOverlay();

  return (
    <>
      <Button largo onClick={() => abrir('painel', ID_NOVO_AGENDAMENTO)}>
        {textos.acoes.novoAgendamento}
      </Button>
      <SheetNovoAgendamento
        clientesRecentes={clientesRecentes}
        servicosMaisUsados={servicosMaisUsados}
        horariosLivres={horariosLivres}
        diaDosHorarios={diaDosHorarios}
      />
    </>
  );
}
