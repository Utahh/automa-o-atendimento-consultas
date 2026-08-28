import { textos } from '@/shared/i18n';
import { Vazio } from '@/shared/ui';

export const metadata = { title: textos.nav.clientes };

export default function Tela() {
  return (
    <div className="flex flex-col gap-4">
      <header className="camada-grudado bg-fundo/90 sticky top-0 py-2 backdrop-blur">
        <h1 className="text-[22px] font-semibold tracking-tight">{textos.nav.clientes}</h1>
      </header>
      <Vazio titulo={textos.estados.carregando} />
    </div>
  );
}
