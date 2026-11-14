import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const env = { ...process.env };
const testEnv = existsSync('.env.test.local') ? parseEnv(readFileSync('.env.test.local','utf8')) : {};
const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local','utf8')) : {};
const productionUrl = env.DATABASE_URL || local.DATABASE_URL;
for (const key of ['DATABASE_URL','DIRECT_URL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET']) delete env[key];
env.NEXTAUTH_SECRET = randomBytes(32).toString('hex');
env.NEXTAUTH_URL = 'http://localhost:3000';
env.TEST_DATABASE_URL = testEnv.TEST_DATABASE_URL || env.TEST_DATABASE_URL || '';
if (env.TEST_DATABASE_URL) {
  try {
    const testUrl = new URL(env.TEST_DATABASE_URL);
    const production = productionUrl ? new URL(productionUrl) : null;
    if (!['postgresql:','postgres:'].includes(testUrl.protocol) || !/^\/lab13[\w-]*_test$/.test(testUrl.pathname) || (production && testUrl.host === production.host && testUrl.pathname === production.pathname)) throw new Error();
  } catch { console.error('TEST_DATABASE_URL debe apuntar a una base PostgreSQL exclusiva llamada lab13..._test, distinta de la aplicación.'); process.exit(2); }
  env.DATABASE_URL = env.TEST_DATABASE_URL;
  env.DIRECT_URL = env.TEST_DATABASE_URL;
  const migration = spawnSync(process.execPath,['scripts/prisma.mjs','migrate','deploy'], { env, stdio: 'pipe' });
  if (migration.status !== 0) { console.error('No se pudieron aplicar las migraciones en la base de pruebas. Comprueba conexión y permisos. No se muestran datos de conexión.'); process.exit(2); }
}
if (process.argv.includes('--db') && !env.TEST_DATABASE_URL) {
  console.error('Pruebas PostgreSQL NO ejecutadas: falta TEST_DATABASE_URL exclusiva en .env.test.local.'); process.exit(2);
}
const files = readdirSync('tests').filter(file=>file.endsWith('.test.ts') && (!process.argv.includes('--db') || file.includes('.integration.'))).map(file=>'tests/'+file);
const result = spawnSync(process.execPath,['--conditions=react-server','--import','tsx','--test','--test-concurrency=1',...files], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
