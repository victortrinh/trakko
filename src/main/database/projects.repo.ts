import { getDb } from './connection';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../shared/types';

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    gitRepoPath: (row.git_repo_path as string) || null,
    color: (row.color as string) || '#3b82f6',
    icon: (row.icon as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    sortOrder: row.sort_order as number,
  };
}

export function listProjects(): Project[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC').all();
  return rows.map((row) => rowToProject(row as Record<string, unknown>));
}

export function getProject(id: string): Project | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return row ? rowToProject(row as Record<string, unknown>) : undefined;
}

export function createProject(input: CreateProjectInput): Project {
  const db = getDb();
  const id = crypto.randomUUID();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM projects').get() as { next: number };

  db.prepare(
    `INSERT INTO projects (id, name, description, git_repo_path, color, icon, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.description || '', input.gitRepoPath || null, input.color || '#3b82f6', input.icon || null, maxOrder.next);

  return getProject(id)!;
}

export function updateProject(input: UpdateProjectInput): Project {
  const db = getDb();
  const existing = getProject(input.id);
  if (!existing) throw new Error(`Project not found: ${input.id}`);

  db.prepare(
    `UPDATE projects SET
       name = ?,
       description = ?,
       git_repo_path = ?,
       color = ?,
       icon = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    input.name ?? existing.name,
    input.description ?? existing.description,
    input.gitRepoPath !== undefined ? input.gitRepoPath : existing.gitRepoPath,
    input.color ?? existing.color,
    input.icon !== undefined ? input.icon : existing.icon,
    input.id
  );

  return getProject(input.id)!;
}

export function deleteProject(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}
