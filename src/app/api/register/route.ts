import { Prisma } from "@prisma/client";
import { validateRegistration } from "@/lib/validation";
import { getDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { BodyError, clientIdentity, consumeLimit, readSmallJson, sameOrigin } from "@/lib/server/request-security";

export const runtime = "nodejs";
const reply = (body: object, status: number, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });
const accepted = () => reply({ message: "Registro procesado. Ya puedes intentar iniciar sesión con tus datos." }, 202);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ message: "Origen de solicitud no permitido." }, 403);
  try {
    const result = validateRegistration(await readSmallJson(request));
    if (!result.ok) return reply({ message: "Revisa los campos indicados.", errors: result.errors }, 400);
    const ipLimit = await consumeLimit("register-ip", clientIdentity(request.headers), 5, 3600);
    if (!ipLimit.allowed) return reply({ message: "Demasiadas solicitudes. Inténtalo más tarde." }, 429, { "Retry-After": String(ipLimit.retryAfter) });
    const emailLimit = await consumeLimit("register-email", result.data.email, 3, 3600);
    if (!emailLimit.allowed) return reply({ message: "Demasiadas solicitudes. Inténtalo más tarde." }, 429, { "Retry-After": String(emailLimit.retryAfter) });
    const passwordHash = await hashPassword(result.data.password);
    try {
      await getDb().user.create({ data: { name: result.data.name, email: result.data.email, passwordHash }, select: { id: true } });
    } catch (error) {
      // Índice único, también ante registros concurrentes. Misma respuesta para no enumerar cuentas.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
    return accepted();
  } catch (error) {
    if (error instanceof BodyError) return reply({ message: "Solicitud no válida." }, error.status);
    // No se serializan errores Prisma, datos del formulario ni cadenas de conexión.
    return reply({ message: "El registro no está disponible temporalmente. Inténtalo más tarde." }, 503);
  }
}
