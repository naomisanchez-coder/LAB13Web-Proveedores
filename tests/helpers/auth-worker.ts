// Solo lo invoca la suite de PostgreSQL contra su base exclusiva de pruebas.
import { authenticateCredentials } from "../../src/lib/server/credentials";
import { getDb } from "../../src/lib/server/db";

async function main() {
  let body = '';
  for await (const chunk of process.stdin) body += chunk;
  try {
    const input = JSON.parse(body);
    const user = await authenticateCredentials({ email: input.email, password: input.password }, new Headers({ 'x-vercel-forwarded-for': '192.0.2.11' }));
    process.stdout.write(JSON.stringify({ authenticated: !!user }));
  } catch { process.exitCode = 1; }
  finally { await getDb().$disconnect(); }
}
void main().catch(() => { process.exitCode = 1; });
