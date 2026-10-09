import Badge from '@/components/ui/Badge';
import { statusLabel, statusTone } from '@/lib/statusStyles';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

/** Consistent status chip backed by the centralized status styles. */
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}
