import { textos } from '@/shared/i18n';
import { AgendaDoDia } from '@/modules/agenda';

export const metadata = { title: textos.agenda.tituloDia };

export default function Agenda() {
  return (
    <div className="flex flex-col gap-4">
      <header className="camada-grudado bg-fundo/90 sticky top-0 py-2 backdrop-blur">
        <h1 className="text-[22px] font-semibold tracking-tight">{textos.agenda.tituloDia}</h1>
      </header>
      <AgendaDoDia agendamentos={[]} />
    </div>
  );
}
