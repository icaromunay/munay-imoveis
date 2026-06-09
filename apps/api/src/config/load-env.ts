import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envCandidates = [
  resolve(__dirname, '..', '..', '.env'),
  resolve(__dirname, '..', '..', '..', '..', '.env')
];

let loadedEnvPath: string | null = null;

for (const envPath of envCandidates) {
  if (!existsSync(envPath)) {
    continue;
  }

  const result = loadEnv({ path: envPath, override: false });

  if (!result.error) {
    loadedEnvPath = envPath;
    break;
  }
}

export function ensureApiEnvLoaded() {
  return {
    loadedEnvPath,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET)
  };
}
