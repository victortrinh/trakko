import { getDb } from './connection';
import type { Label } from '../../shared/types';

function rowToLabel(row: Record<string, unknown>): Label {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: row.created_at as string,
  };
}

export function listLabels(projectId: string): Label[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM labels WHERE project_id = ? ORDER BY name ASC')
    .all(projectId);
  return rows.map((row) => rowToLabel(row as Record<string, unknown>));
}

export function createLabel(projectId: string, name: string, color: string): Label {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO labels (id, project_id, name, color) VALUES (?, ?, ?, ?)'
  ).run(id, projectId, name, color);
  const row = db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
  return rowToLabel(row as Record<string, unknown>);
}

export function deleteLabel(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM labels WHERE id = ?').run(id);
}

export function addLabelToTask(taskId: string, labelId: string): void {
  const db = getDb();
  db.prepare(
    'INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)'
  ).run(taskId, labelId);
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM task_labels WHERE task_id = ? AND label_id = ?'
  ).run(taskId, labelId);
}

export function getLabelsForTasks(taskIds: string[]): Record<string, Label[]> {
  if (taskIds.length === 0) return {};
  const db = getDb();
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT tl.task_id, l.* FROM task_labels tl
       JOIN labels l ON tl.label_id = l.id
       WHERE tl.task_id IN (${placeholders})
       ORDER BY l.name ASC`
    )
    .all(...taskIds) as Record<string, unknown>[];

  const result: Record<string, Label[]> = {};
  for (const row of rows) {
    const taskId = row.task_id as string;
    if (!result[taskId]) result[taskId] = [];
    result[taskId].push(rowToLabel(row));
  }
  return result;
}
