import { LoaderCircle } from 'lucide-react';

export default function ActionProgress({ label = 'Working...', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'} font-semibold`} role="status" aria-live="polite">
      <LoaderCircle size={compact ? 13 : 15} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
