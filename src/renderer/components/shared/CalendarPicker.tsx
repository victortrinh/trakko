import { useState, useRef, useEffect, type RefObject } from 'react';

interface CalendarPickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarPicker({ value, onChange, onClose, triggerRef }: CalendarPickerProps) {
  const today = new Date().toLocaleDateString('en-CA');
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [triggerRef]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    onChange(toDateString(viewYear, viewMonth, day));
    onClose();
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Build calendar grid
  const cells: { day: number; inMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, inMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }

  // Next month leading days
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, inMonth: false });
    }
  }

  return (
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left }}
      className="fixed bg-surface-2 border border-border rounded-lg p-3 shadow-xl z-[9999] w-[260px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-xs font-medium text-text-primary">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-[10px] text-text-tertiary text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dateStr = cell.inMonth ? toDateString(viewYear, viewMonth, cell.day) : '';
          const isSelected = cell.inMonth && dateStr === value;
          const isToday = cell.inMonth && dateStr === today;

          return (
            <button
              key={i}
              onClick={() => cell.inMonth && selectDate(cell.day)}
              disabled={!cell.inMonth}
              className={`w-8 h-8 mx-auto text-xs rounded-full flex items-center justify-center transition-colors
                ${!cell.inMonth ? 'text-text-tertiary/40 cursor-default' : 'hover:bg-surface-3 cursor-pointer'}
                ${isSelected ? 'bg-accent text-white hover:bg-accent-hover' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-accent/50' : ''}
                ${cell.inMonth && !isSelected ? 'text-text-primary' : ''}
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Clear button */}
      {value && (
        <button
          onClick={() => {
            onChange(null);
            onClose();
          }}
          className="mt-2 w-full text-xs text-text-secondary hover:text-text-primary py-1 hover:bg-surface-3 rounded transition-colors"
        >
          Clear date
        </button>
      )}
    </div>
  );
}
