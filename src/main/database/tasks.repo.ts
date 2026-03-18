import { getDb } from './connection';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTaskInput,
} from '../../shared/types';

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    status: row.status as Task['status'],
    sortOrder: row.sort_order as number,
    priority: (row.priority as Task['priority']) || null,
    dueDate: (row.due_date as string) || null,
    archivedAt: (row.archived_at as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function listTasksByProject(projectId: string): Task[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM tasks WHERE project_id = ? AND archived_at IS NULL ORDER BY sort_order ASC')
    .all(projectId);
  return rows.map((row) => rowToTask(row as Record<string, unknown>));
}

export function getTask(id: string): Task | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? rowToTask(row as Record<string, unknown>) : undefined;
}

export function createTask(input: CreateTaskInput): Task {
  const db = getDb();
  const id = crypto.randomUUID();
  const status = input.status || 'todo';

  const maxOrder = db
    .prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM tasks WHERE project_id = ? AND status = ?'
    )
    .get(input.projectId, status) as { next: number };

  db.prepare(
    `INSERT INTO tasks (id, project_id, title, description, status, sort_order, priority, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.projectId, input.title, input.description || '', status, maxOrder.next, input.priority || null, input.dueDate || null);

  return getTask(id)!;
}

export function updateTask(input: UpdateTaskInput): Task {
  const db = getDb();
  const existing = getTask(input.id);
  if (!existing) throw new Error(`Task not found: ${input.id}`);

  db.prepare(
    `UPDATE tasks SET
       title = ?,
       description = ?,
       status = ?,
       sort_order = ?,
       priority = ?,
       due_date = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    input.title ?? existing.title,
    input.description ?? existing.description,
    input.status ?? existing.status,
    input.sortOrder ?? existing.sortOrder,
    input.priority !== undefined ? input.priority : existing.priority,
    input.dueDate !== undefined ? input.dueDate : existing.dueDate,
    input.id
  );

  return getTask(input.id)!;
}

export function deleteTask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function reorderTask(input: ReorderTaskInput): void {
  const db = getDb();
  db.prepare(
    `UPDATE tasks SET
       status = ?,
       sort_order = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(input.status, input.sortOrder, input.id);
}

export function archiveTask(id: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).run(id);
}

export function restoreTask(id: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE tasks SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?`
  ).run(id);
}

export function listArchivedTasks(projectId: string): Task[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM tasks WHERE project_id = ? AND archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all(projectId);
  return rows.map((row) => rowToTask(row as Record<string, unknown>));
}

export function bulkArchiveDone(projectId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now')
     WHERE project_id = ? AND status = 'done' AND archived_at IS NULL`
  ).run(projectId);
}

export function getTasksDueSoon(): Task[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE due_date IS NOT NULL
         AND archived_at IS NULL
         AND status != 'done'
         AND due_date <= date('now', '+1 day')
       ORDER BY due_date ASC`
    )
    .all();
  return rows.map((row) => rowToTask(row as Record<string, unknown>));
}

export function hasBeenNotified(taskId: string, type: string, date: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT 1 FROM notification_log WHERE task_id = ? AND type = ? AND notified_date = ?')
    .get(taskId, type, date);
  return !!row;
}

export function recordNotification(taskId: string, type: string, date: string): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO notification_log (task_id, type, notified_date) VALUES (?, ?, ?)').run(
    taskId,
    type,
    date
  );
}
