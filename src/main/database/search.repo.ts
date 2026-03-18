import { getDb } from './connection';
import type { TaskSearchResult } from '../../shared/types';

export function searchTasks(query: string): TaskSearchResult[] {
  const db = getDb();
  const pattern = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.title LIKE ? OR t.description LIKE ?
       ORDER BY t.updated_at DESC
       LIMIT 20`
    )
    .all(pattern, pattern);

  return (rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    status: row.status as TaskSearchResult['status'],
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    projectName: row.project_name as string,
  }));
}
