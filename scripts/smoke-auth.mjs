import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";

// Solo HTTP local. No abre navegador ni contacta Google. No imprime cookies o secretos.
process.loadEnvFile(".env.local");
const base = "http://localhost:3000";
const secret = process.env.NEXTAUTH_SECRET;
assert.ok(secret, "Falta NEXTAUTH_SECRET local");
let checks = 0;
function passed(label) { checks++; console.log(`OK ${label}`); }
const request = (path, headers = {}) => fetch(base + path, { redirect: "manual", headers });

async function denied(path, cookie = "") {
  const response = await request(path, cookie ? { cookie } : {});
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/signIn");
  passed(`acceso rechazado: ${path}${cookie ? " (cookie no válida)" : ""}`);
}

const home = await request("/");
assert.equal(home.status, 307);
assert.equal(new URL(home.headers.get("location"), base).pathname, "/dashboard");
passed("raíz redirige al dashboard");

for (const path of ["/dashboard", "/profile", "/dashboard/nested", "/profile/nested"]) {
  await denied(path);
}
const login = await fetch(base + "/signIn");
assert.equal(login.status, 200);
assert.match(await login.text(), /Bienvenido de nuevo/);
passed("login público sin bucles");

const registration = await request("/register");
assert.equal(registration.status, 200);
assert.match(await registration.text(), /Confirmar contraseña/);
passed("registro accesible con confirmación de contraseña");
const foreign = await fetch(base + "/api/register", { method: "POST", headers: {origin:"https://attacker.example"}, redirect:"manual" });
assert.equal(foreign.status,403);
passed("registro rechaza otro origen");
const invalidRegistration = await fetch(base + "/api/register", { method: "POST", headers: {origin:base,"content-type":"application/json"},body:"{}" });
assert.equal(invalidRegistration.status,400);
passed("registro valida desde el servidor");
if (!process.env.DATABASE_URL) {
  const missingDb = await fetch(base + "/api/register", { method:"POST", headers:{origin:base,"content-type":"application/json"},body:JSON.stringify({name:"Prueba local",email:"smoke@example.test",password:"OnlyForSmoke123",confirmPassword:"OnlyForSmoke123"}) });
  assert.equal(missingDb.status,503);
  assert.doesNotMatch(await missingDb.text(),/Prisma|DATABASE_URL|passwordHash/);
  passed("sin PostgreSQL no se simula un registro exitoso");
}
const providers = await (await request("/api/auth/providers")).json();
assert.equal(providers.google?.id, "google");
assert.equal(providers.credentials?.id, "credentials");
assert.equal(!!providers.github, !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET));
passed("Google y CredentialsProvider registrados; GitHub coincide con configuración");
assert.deepEqual(await (await request("/api/auth/session")).json(), {});
passed("sesión anónima vacía");

for (const path of ["/dashboard", "/profile"]) {
  await denied(path, "next-auth.session-token=invalid-test-cookie");
}
const expired = await encode({ secret, token: { sub: "expired-local-test" }, maxAge: -3600 });
for (const path of ["/dashboard", "/profile"]) {
  await denied(path, `next-auth.session-token=${expired}`);
}

// Fixture firmado localmente para verificar renderizado y JWT. No simula el flujo Google.
const token = await encode({ secret, token: {
  sub: "local-smoke-test", name: "Usuario de prueba local",
  email: "local-test@example.test", picture: "https://lh3.googleusercontent.com/test-avatar",
}, maxAge: 60 });
const sessionCookie = `next-auth.session-token=${token}`;
const session = await (await request("/api/auth/session", { cookie: sessionCookie })).json();
assert.equal(session.user.email, "local-test@example.test");
passed("API reconoce JWT local de prueba");
for (const path of ["/dashboard", "/profile"]) {
  const response = await request(path, { cookie: sessionCookie });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Usuario de prueba local/);
  assert.match(html, /Cerrar sesión/);
  if (path === "/profile") {
    assert.match(html, /local-test@example.test/);
    assert.match(html, /lh3.googleusercontent.com/);
  }
  passed(`renderizado con JWT de prueba: ${path}`);
}
const noCsrf = await fetch(base + "/api/auth/callback/credentials", { method:"POST",redirect:"manual",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({email:"smoke@example.test",password:"OnlyForSmoke123",json:"true"}) });
assert.ok(!noCsrf.headers.getSetCookie().some(cookie=>cookie.startsWith("next-auth.session-token=") && !cookie.includes("Max-Age=0")));
passed("CredentialsProvider sin CSRF no crea sesión");
const csrfResponse = await request("/api/auth/csrf", { cookie: sessionCookie });
const { csrfToken } = await csrfResponse.json();
assert.ok(csrfToken);
const csrfCookie = csrfResponse.headers.getSetCookie()
  .find((cookie) => cookie.startsWith("next-auth.csrf-token="))?.split(";")[0];
assert.ok(csrfCookie);
if (!process.env.DATABASE_URL) {
  const failedLogin = await fetch(base + "/api/auth/callback/credentials", {
    method:"POST", redirect:"manual", headers:{cookie:csrfCookie,"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({csrfToken,email:"smoke@example.test",password:"OnlyForSmoke123",callbackUrl:base+"/dashboard",json:"true"})
  });
  assert.equal(failedLogin.status,401);
  assert.ok(!failedLogin.headers.getSetCookie().some(cookie=>cookie.startsWith("next-auth.session-token=") && !cookie.includes("Max-Age=0")));
  passed("CredentialsProvider con CSRF falla de forma cerrada sin PostgreSQL");
}
const logout = await fetch(base + "/api/auth/signout", {
  method: "POST", redirect: "manual",
  headers: { cookie: `${sessionCookie}; ${csrfCookie}`, "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ csrfToken, callbackUrl: base + "/signIn", json: "true" }),
});
assert.equal(logout.status, 200);
assert.equal((await logout.json()).url, base + "/signIn");
assert.ok(logout.headers.getSetCookie().some((cookie) =>
  cookie.startsWith("next-auth.session-token=;") && cookie.includes("Max-Age=0")));
passed("signout con CSRF elimina cookie y vuelve al login");
await denied("/dashboard");
await denied("/profile");
console.log(`${checks} comprobaciones HTTP correctas. Estas comprobaciones no prueban OAuth real ni operaciones PostgreSQL.`);
