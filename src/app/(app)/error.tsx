'use client';

import { ErroNaTela } from '@/shared/ui';

export default function ErroDaArea({ reset }: { error: Error; reset: () => void }) {
  return <ErroNaTela codigo="ERRO_INTERNO" aoTentarNovamente={reset} />;
}
