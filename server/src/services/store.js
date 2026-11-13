import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const storePath = path.join(dataDir, 'emobi-store.json');

const readStore = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    return {
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      companions: parsed.companions && typeof parsed.companions === 'object' ? parsed.companions : {},
    };
  } catch (err) {
    return { users: [], sessions: {}, companions: {} };
  }
};

export const database = readStore();

export const saveDatabase = () => {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const temporaryPath = `${storePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(database, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryPath, storePath);
};

export const getSessionSecret = () => {
  if (!database.sessionSecret) {
    database.sessionSecret = randomBytes(48).toString('hex');
    saveDatabase();
  }
  return database.sessionSecret;
};
