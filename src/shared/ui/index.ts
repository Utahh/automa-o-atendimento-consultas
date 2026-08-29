/**
 * Um componente so entra em shared/ui quando e usado por DOIS modulos
 * diferentes. Ate la, mora no modulo onde nasceu — e assim nao existe
 * "pasta de componentes" que ninguem sabe de onde veio.
 */
export { cn } from './cn';

export { AppShell } from './layout/AppShell';
export { Page } from './layout/Page';
export { Stack } from './layout/Stack';
export { Cluster } from './layout/Cluster';
export { Grid } from './layout/Grid';

export { Button } from './primitives/Button';
export { Card } from './primitives/Card';
export { Divider } from './primitives/Divider';
export { Logo, Simbolo } from './primitives/Logo';

export { Skeleton, Carregando } from './data/Skeleton';
export { EmptyState } from './data/EmptyState';
export { List } from './data/List';

export { Banner } from './feedback/Banner';
export { ErrorState } from './feedback/ErrorState';
export { OfflineBanner } from './feedback/OfflineBanner';
export { StatusBadge } from './feedback/StatusBadge';
export type { EstadoVisual } from './feedback/StatusBadge';

export { Field } from './form/Field';
export { Input } from './form/Input';
export { Chip } from './form/Chip';

export { Portal } from './overlay/Portal';
export { Scrim } from './overlay/Scrim';
export { Sheet } from './overlay/Sheet';
export { ToastProvider, useToast } from './overlay/Toast';

export { BottomNav } from './nav/BottomNav';
export { SideNav } from './nav/SideNav';
export { NavItem } from './nav/NavItem';
export { MenuSuspenso } from './nav/MenuSuspenso';
export type { ItemDeMenu } from './nav/MenuSuspenso';

export { OverlayProvider, useOverlay } from './hooks/use-overlay';
export type { NivelDeCamada } from './hooks/use-overlay';
export { useMediaQuery, usePonteiroPreciso, useTelaLarga } from './hooks/use-media-query';
