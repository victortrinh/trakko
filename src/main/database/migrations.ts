import { getDb } from './connection';

const CURRENT_VERSION = 5;

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
  2: `
    ALTER TABLE tasks ADD COLUMN archived_at TEXT DEFAULT NULL;
    CREATE INDEX idx_tasks_archived ON tasks(project_id, archived_at);
  `,
  3: `
    ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT NULL
      CHECK(priority IN ('low','medium','high','urgent'));

    CREATE TABLE labels (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );
  `,
  4: `
    ALTER TABLE tasks ADD COLUMN due_date TEXT DEFAULT NULL;

    CREATE TABLE notification_log (
      task_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('due_today','overdue')),
      notified_date TEXT NOT NULL,
      PRIMARY KEY (task_id, type, notified_date),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `,
  5: `
    -- Fix tasks CHECK constraint to include in_review
    CREATE TABLE tasks_new (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','in_review','done')),
      sort_order REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      archived_at TEXT DEFAULT NULL,
      priority TEXT DEFAULT NULL CHECK(priority IN ('low','medium','high','urgent')),
      due_date TEXT DEFAULT NULL,
      task_number INTEGER DEFAULT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    INSERT INTO tasks_new (id, project_id, title, description, status, sort_order,
      created_at, updated_at, archived_at, priority, due_date)
      SELECT id, project_id, title, description, status, sort_order,
      created_at, updated_at, archived_at, priority, due_date FROM tasks;
    DROP TABLE tasks;
    ALTER TABLE tasks_new RENAME TO tasks;
    CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
    CREATE INDEX idx_tasks_archived ON tasks(project_id, archived_at);

    -- Backfill task numbers per project
    UPDATE tasks SET task_number = (
      SELECT COUNT(*) FROM tasks t2
      WHERE t2.project_id = tasks.project_id
        AND (t2.created_at < tasks.created_at OR (t2.created_at = tasks.created_at AND t2.id <= tasks.id))
    );

    -- Project color & icon
    ALTER TABLE projects ADD COLUMN color TEXT DEFAULT '#3b82f6';
    ALTER TABLE projects ADD COLUMN icon TEXT DEFAULT NULL;
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
