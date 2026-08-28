import { cn } from '../cn';

export function Divider({ className }: { readonly className?: string }) {
  return <div role="separator" className={cn('bg-border h-px w-full shrink-0', className)} />;
}
