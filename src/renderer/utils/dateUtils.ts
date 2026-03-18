type DueDateStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming';

function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
}

export function getDueDateStatus(dueDate: string): DueDateStatus {
  const today = getLocalToday();
  const tomorrow = getTomorrow();

  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate === tomorrow) return 'tomorrow';
  return 'upcoming';
}

export function formatDueDate(dueDate: string): string {
  const status = getDueDateStatus(dueDate);
  if (status === 'overdue') return 'Overdue';
  if (status === 'today') return 'Today';
  if (status === 'tomorrow') return 'Tomorrow';

  const date = new Date(dueDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDueDateColor(status: DueDateStatus): string {
  switch (status) {
    case 'overdue':
      return 'text-danger';
    case 'today':
    case 'tomorrow':
      return 'text-priority-medium';
    case 'upcoming':
      return 'text-text-tertiary';
  }
}
