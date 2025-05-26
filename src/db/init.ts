import Database, { Database as DBInstance } from 'better-sqlite3';

let db: DBInstance | null = null;

export function getDatabase(): DBInstance {
  if (!db) {
    db = new Database('plex_tracker.db', {
      verbose: console.log,
    });

    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: DBInstance) {
  database
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS last_seen (
      section_id INTEGER PRIMARY KEY,
      last_id INTEGER NOT NULL
    )
  `
    )
    .run();
}
