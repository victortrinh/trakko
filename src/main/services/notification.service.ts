import { Notification, BrowserWindow } from 'electron';
import { getTasksDueSoon, hasBeenNotified, recordNotification } from '../database/tasks.repo';

let intervalId: ReturnType<typeof setInterval> | null = null;

function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
}

function checkDueDates(): void {
  if (!Notification.isSupported()) return;

  const today = getLocalToday();
  const tasks = getTasksDueSoon();

  for (const task of tasks) {
    if (!task.dueDate) continue;

    const isOverdue = task.dueDate < today;
    const isDueToday = task.dueDate === today;

    if (isOverdue && !hasBeenNotified(task.id, 'overdue', today)) {
      const notification = new Notification({
        title: 'Task Overdue',
        body: task.title,
      });
      notification.on('click', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.show();
          win.focus();
        }
      });
      notification.show();
      recordNotification(task.id, 'overdue', today);
    } else if (isDueToday && !hasBeenNotified(task.id, 'due_today', today)) {
      const notification = new Notification({
        title: 'Task Due Today',
        body: task.title,
      });
      notification.on('click', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.show();
          win.focus();
        }
      });
      notification.show();
      recordNotification(task.id, 'due_today', today);
    }
  }
}

export function startNotificationService(): void {
  setTimeout(checkDueDates, 5000);
  intervalId = setInterval(checkDueDates, 60000);
}

export function stopNotificationService(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
