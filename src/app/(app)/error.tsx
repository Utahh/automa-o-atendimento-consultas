'use client';

import { ErrorState } from '@/shared/ui';

export default function ErroDaArea({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState codigo="ERRO_INTERNO" aoTentarNovamente={reset} />;
}
