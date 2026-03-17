import { getDb } from './connection';

const CURRENT_VERSION = 1;

const migrations: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS app_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT DEFAULT '',
      git_repo_path TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      sort_order    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
      sort_order    REAL NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
  `,
};

export function runMigrations(): void {
  const db = getDb();

  // Ensure app_state table exists for version tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('schema_version') as
    | { value: string }
    | undefined;
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  if (currentVersion < CURRENT_VERSION) {
    const migrate = db.transaction(() => {
      for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
        if (migrations[v]) {
          db.exec(migrations[v]);
        }
      }
      db.prepare(
        'INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)'
      ).run('schema_version', String(CURRENT_VERSION));
    });
    migrate();
  }
}
