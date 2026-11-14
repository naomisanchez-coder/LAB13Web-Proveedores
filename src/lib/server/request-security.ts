import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getDb } from "./db";

type RequestHeaders = Headers | Record<string, string | string[] | undefined>;
export function clientIdentity(headers: RequestHeaders): string {
  // Solo se confía en la cabecera sanitizada por Vercel dentro de Vercel.
  // En local/otros hosts se comparte un bucket; no se confía en XFF del visitante.
  if (process.env.VERCEL !== "1") return "shared-local";
  const raw = headers instanceof Headers ? headers.get("x-vercel-forwarded-for") : headers["x-vercel-forwarded-for"];
  const address = (Array.isArray(raw) ? raw[0] : raw)?.split(",")[0]?.trim();
  return address && isIP(address) ? address : "unknown-vercel";
}

export function securityKey(scope: string, identifier: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Configuración de seguridad incompleta.");
  return createHmac("sha256", secret).update(`${scope}\0${identifier}`).digest("hex");
}

export async function consumeLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const key = securityKey(scope, identity);
  // UPSERT atómico: solicitudes concurrentes no pierden incrementos. Hora de PostgreSQL.
  const rows = await getDb().$queryRaw<{ hits: number; retryAfter: number }[]>`
    INSERT INTO "request_limits" ("key", "hits", "expires_at")
    VALUES (${key}, 1, CURRENT_TIMESTAMP + ${windowSeconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "hits" = CASE WHEN "request_limits"."expires_at" <= CURRENT_TIMESTAMP THEN 1
                    ELSE LEAST("request_limits"."hits" + 1, ${limit + 1}) END,
      "expires_at" = CASE WHEN "request_limits"."expires_at" <= CURRENT_TIMESTAMP
                         THEN CURRENT_TIMESTAMP + ${windowSeconds} * INTERVAL '1 second'
                         ELSE "request_limits"."expires_at" END
    RETURNING "hits", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expires_at" - CURRENT_TIMESTAMP))))::int AS "retryAfter"
  `;
  return { allowed: rows[0].hits <= limit, retryAfter: rows[0].retryAfter };
}

export function sameOrigin(request: Request): boolean {
  try {
    return new URL(request.headers.get("origin") ?? "").origin === new URL(process.env.NEXTAUTH_URL ?? "").origin;
  } catch { return false; }
}

export class BodyError extends Error {
  constructor(public status: number) { super("Solicitud no válida."); }
}
export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new BodyError(415);
  if (Number(request.headers.get("content-length")) > 4096) throw new BodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new BodyError(413); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof BodyError) throw error;
    throw new BodyError(400);
  } finally { reader.releaseLock(); }
}
