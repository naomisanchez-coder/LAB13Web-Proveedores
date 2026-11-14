import "server-only";
import { randomBytes } from "node:crypto";
import { normalizeEmail, passwordBytes, validEmail } from "../validation";
import { afterFailure, emptyAttempt, isLocked } from "../lock-policy";
import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { clientIdentity, consumeLimit, securityKey } from "./request-security";

const dummyHash = hashPassword(randomBytes(32).toString("hex"));
export async function authenticateCredentials(
  input: Record<string, string> | undefined,
  headers: Headers | Record<string, string | string[] | undefined>,
) {
  try {
    const limit = await consumeLimit("login-ip", clientIdentity(headers), 20, 15 * 60);
    if (!limit.allowed) return null;
    const email = normalizeEmail(input?.email ?? "");
    const password = input?.password ?? "";
    if (!validEmail(email) || !password || passwordBytes(password) > 72) return null;
    const key = securityKey("login-account", email);
    return await getDb().$transaction(async (tx) => {
      // Serializa todos los accesos a esta cuenta entre procesos/instancias serverless.
      // La consulta devuelve un entero, no el tipo PostgreSQL void.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      const [{ now }] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      const stored = await tx.loginAttempt.findUnique({ where: { key } });
      const state = stored ?? emptyAttempt();
      if (isLocked(state, now)) return null;
      const user = await tx.user.findUnique({ where: { email } });
      const valid = await verifyPassword(password, user?.passwordHash ?? await dummyHash);
      if (!user?.passwordHash || !valid) {
        const failure = afterFailure(state, now);
        await tx.loginAttempt.upsert({ where: { key }, create: { key, ...failure }, update: failure });
        return null;
      }
      await tx.loginAttempt.upsert({ where: { key }, create: { key, ...emptyAttempt() }, update: emptyAttempt() });
      return { id: `credentials:${user.id}`, name: user.name, email: user.email,
        image: null, createdAt: user.createdAt.toISOString() };
    }, { maxWait: 5000, timeout: 10000 });
  } catch {
    // No se exponen errores Prisma, existencia de cuentas, contadores ni fechas de bloqueo.
    return null;
  }
}
