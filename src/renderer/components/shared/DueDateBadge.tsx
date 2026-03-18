import { getDueDateStatus, formatDueDate, getDueDateColor } from '../../utils/dateUtils';

interface DueDateBadgeProps {
  dueDate: string;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const status = getDueDateStatus(dueDate);
  const color = getDueDateColor(status);

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] ${color}`}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {formatDueDate(dueDate)}
    </span>
  );
}
