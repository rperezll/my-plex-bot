import { getDatabase } from './init';

interface LastSeenRow {
  last_id: number;
}

export const getLastSeenId = (sectionId: number): number => {
  const row = getDatabase()
    .prepare('SELECT last_id FROM last_seen WHERE section_id = ?')
    .get(sectionId) as LastSeenRow | undefined;
  return row?.last_id ?? 0;
};

export const setLastSeenId = (sectionId: number, lastId: number) => {
  getDatabase()
    .prepare(
      `
    INSERT INTO last_seen (section_id, last_id)
    VALUES (?, ?)
    ON CONFLICT(section_id) DO UPDATE SET last_id = excluded.last_id
  `
    )
    .run(sectionId, lastId);
};
