import "server-only";
import { randomBytes } from "node:crypto";
import { normalizeEmail, passwordBytes, validEmail } from "../validation";
import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { clientIdentity, consumeLimit } from "./request-security";

const dummyHash = hashPassword(randomBytes(32).toString("hex"));
export async function authenticateCredentials(
  input: Record<string, string> | undefined,
  headers: Headers | Record<string, string | string[] | undefined>,
) {
  try {
    // Límite persistente antes de cualquier comparación costosa. También cubre el endpoint directo.
    const limit = await consumeLimit("login-ip", clientIdentity(headers), 20, 15 * 60);
    if (!limit.allowed) return null;
    const email = normalizeEmail(input?.email ?? "");
    const password = input?.password ?? "";
    if (!validEmail(email) || !password || passwordBytes(password) > 72) return null;
    const user = await getDb().user.findUnique({ where: { email } });
    const valid = await verifyPassword(password, user?.passwordHash ?? await dummyHash);
    if (!user?.passwordHash || !valid) return null;
    return { id: `credentials:${user.id}`, name: user.name, email: user.email,
      image: null, createdAt: user.createdAt.toISOString() };
  } catch {
    // Mismo fallo público para credenciales incorrectas, límites y servicio no disponible.
    return null;
  }
}
