'use client';

import { useActionState } from 'react';
import { Button, Field, Input, Stack } from '@/shared/ui';
import { textos } from '@/shared/i18n';
import { entrarAction, pedirCodigoAction, type EstadoDaEntrada } from '../actions';

/**
 * Entrar em duas telas, uma pergunta por vez.
 *
 * Sem senha para lembrar e sem senha para vazar. O texto é curto de propósito:
 * quem está aqui quer entrar, não ler.
 */
const INICIAL: EstadoDaEntrada = { etapa: 'email' };

export function FormularioDeEntrada() {
  const [estado, pedir, pedindo] = useActionState(pedirCodigoAction, INICIAL);
  const [estadoDaEntrada, entrar, entrando] = useActionState(entrarAction, estado);

  const naEtapaDoCodigo = estado.etapa === 'codigo';
  const atual = naEtapaDoCodigo ? estadoDaEntrada : estado;
  const recusa = atual.motivo;

  if (!naEtapaDoCodigo) {
    return (
      <form action={pedir}>
        <Stack espaco={4}>
          <Field
            rotulo={textos.entrar.email}
            para="email"
            dica={textos.entrar.dicaEmail}
            {...(recusa !== undefined ? { erro: textos.entrar.recusa[recusa] } : {})}
          >
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              autoFocus
            />
          </Field>
          <Button largo type="submit" disabled={pedindo}>
            {textos.entrar.pedirCodigo}
          </Button>
        </Stack>
      </form>
    );
  }

  return (
    <form action={entrar}>
      <Stack espaco={4}>
        <input type="hidden" name="email" value={estado.email ?? ''} readOnly />
        <p className="texto-bloco text-fg-muted text-sm">
          {textos.entrar.enviadoPara} {estado.email}
        </p>
        <Field
          rotulo={textos.entrar.codigo}
          para="codigo"
          dica={textos.entrar.dicaCodigo}
          {...(recusa !== undefined ? { erro: textos.entrar.recusa[recusa] } : {})}
        >
          <Input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
        </Field>
        <Button largo type="submit" disabled={entrando}>
          {textos.entrar.entrar}
        </Button>
      </Stack>
    </form>
  );
}
