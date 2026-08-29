import { textos } from '@/shared/i18n';
import { minhaAgenda } from '@/modules/cliente';
import { MinhaAgendaCliente } from '@/modules/cliente/ui/MinhaAgendaCliente';

export const metadata = { title: textos.cliente.titulo };
export const dynamic = 'force-dynamic';

export default async function CasaDoCliente() {
  const agenda = await minhaAgenda();
  return <MinhaAgendaCliente agenda={agenda} />;
}
