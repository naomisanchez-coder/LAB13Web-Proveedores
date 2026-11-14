import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { validateTestDatabaseURL } from "./test-database-config.mjs";

async function main() {
  const testEnv = existsSync('.env.test.local') ? parseEnv(readFileSync('.env.test.local','utf8')) : {};
  const application = existsSync('.env.local') ? parseEnv(readFileSync('.env.local','utf8')) : {};
  const direct = testEnv.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!direct) throw new Error('Falta la conexión exclusiva TEST_DATABASE_URL; no se ejecutaron pruebas HTTP.');
  validateTestDatabaseURL(direct, process.env.DATABASE_URL || application.DATABASE_URL);
  if (!existsSync('.next/BUILD_ID')) throw new Error('Falta el build de producción para el servidor aislado.');
  const pooled = new URL(direct);
  if (pooled.hostname.endsWith('.neon.tech')) pooled.hostname = pooled.hostname.replace('.', '-pooler.');
  const probe = createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
  const port = probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const secret = randomBytes(32).toString('hex');
  const env = {...process.env,DATABASE_URL:pooled.toString(),DIRECT_URL:direct,NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret};
  delete env.VERCEL;
  const migrate = spawnSync(process.execPath,['scripts/prisma.mjs','migrate','deploy'],{env,stdio:'pipe'});
  if (migrate.status!==0) throw new Error('Falló la preparación de la base aislada; se omitieron detalles de conexión.');
  const server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port',String(port),'--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});
  // Consumo los logs sin publicar URLs de callbacks, cookies o detalles de conexión.
  server.stdout.resume(); server.stderr.resume();
  const db = new PrismaClient({datasources:{db:{url:direct}},log:[]});
  const email = `http-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString('hex')+'Aa1';
  const key = (scope,identity)=>createHmac('sha256',secret).update(`${scope}\0${identity}`).digest('hex');
  const attemptKey = key('login-account',email);
  const requestKeys = [key('login-ip','shared-local'),key('register-ip','shared-local'),key('register-email',email)];
  const jar = new Map();
  let checks=0;
  const passed = label=>{checks++;console.log('OK '+label);};
  async function request(path, options={}) {
    const headers = new Headers(options.headers);
    if(jar.size) headers.set('cookie',[...jar].map(([name,value])=>`${name}=${value}`).join('; '));
    const response = await fetch(base+path,{...options,headers,redirect:'manual'});
    for(const header of response.headers.getSetCookie()){
      const pair=header.split(';')[0], equals=pair.indexOf('=');
      const name=pair.slice(0,equals), value=pair.slice(equals+1);
      if(/Max-Age=0/i.test(header))jar.delete(name);else jar.set(name,value);
    }
    return response;
  }
  try {
    let ready=false;
    for(let i=0;i<150;i++){
      if(server.exitCode!==null)throw new Error('El servidor HTTP aislado terminó antes de estar listo.');
      try {if((await fetch(base+'/signIn')).status===200){ready=true;break;}}catch{ /* espero el proceso propio */ }
      await delay(200);
    }
    assert.ok(ready,'El servidor de pruebas no estuvo disponible a tiempo.');
    passed('servidor aislado con conexión Neon pooled');
    const register = ()=>request('/api/register',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({name:'Prueba HTTP aislada',email:` ${email.toUpperCase()} `,password,confirmPassword:password})});
    const first=await register();assert.equal(first.status,202);
    const publicBody=await first.text();assert.doesNotMatch(publicBody,/passwordHash|password_hash/);
    const stored=await db.user.findUniqueOrThrow({where:{email}});
    assert.notEqual(stored.passwordHash,password);assert.ok(await bcrypt.compare(password,stored.passwordHash));
    passed('registro HTTP persiste el correo normalizado y un hash bcrypt');
    const duplicate=await register();assert.equal(duplicate.status,202);assert.equal(await duplicate.text(),publicBody);
    assert.equal(await db.user.count({where:{email}}),1);
    passed('registro duplicado no crea otra cuenta ni expone su existencia');
    for(const path of ['/dashboard','/profile'])assert.equal((await request(path)).status,307);
    passed('rutas privadas rechazadas antes del login');
    const csrfResponse=await request('/api/auth/csrf');
    const {csrfToken}=await csrfResponse.json();assert.ok(csrfToken);
    const login = value=>request('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password:value,csrfToken,callbackUrl:base+'/dashboard',json:'true'})});
    for(let i=1;i<=5;i++)assert.equal((await login('IncorrectPassword123')).status,401);
    const locked=await db.loginAttempt.findUniqueOrThrow({where:{key:attemptKey}});
    assert.equal(locked.failedAttempts,5);assert.ok(locked.lockedUntil);
    const [{seconds}]=await db.$queryRaw`SELECT EXTRACT(EPOCH FROM (locked_until - clock_timestamp()))::float8 AS seconds FROM login_attempts WHERE key=${attemptKey}`;
    assert.ok(seconds>870 && seconds<=900,'El bloqueo no corresponde a quince minutos.');
    passed('endpoint directo aplica cinco fallos y bloqueo persistente de quince minutos');
    assert.equal((await login(password)).status,401);
    assert.ok(!jar.has('next-auth.session-token'));
    passed('una contraseña correcta no elude la cuenta bloqueada');
    // Solo modifico el vencimiento del fixture en la base de pruebas exclusiva.
    await db.loginAttempt.update({where:{key:attemptKey},data:{lockedUntil:new Date(Date.now()-1000)}});
    const success=await login(password);assert.equal(success.status,200);
    assert.ok(jar.has('next-auth.session-token'));
    const session=await (await request('/api/auth/session')).json();
    assert.equal(session.user.email,email);assert.equal(session.authProvider,'credentials');
    assert.equal(session.user.id,`credentials:${stored.id}`);
    passed('CredentialsProvider autentica al usuario real y genera una sesión JWT');
    const reset=await db.loginAttempt.findUniqueOrThrow({where:{key:attemptKey}});
    assert.equal(reset.failedAttempts,0);assert.equal(reset.lockedUntil,null);
    passed('el acceso correcto después del plazo restablece el contador');
    for(const path of ['/dashboard','/profile']){
      const response=await request(path);assert.equal(response.status,200);
      assert.ok((await response.text()).includes('Prueba HTTP aislada'));
    }
    passed('dashboard y perfil reconocen la sesión creada por el login real');
    const logout=await request('/api/auth/signout',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken,callbackUrl:base+'/signIn',json:'true'})});
    assert.equal(logout.status,200);assert.ok(!jar.has('next-auth.session-token'));
    for(const path of ['/dashboard','/profile'])assert.equal((await request(path)).status,307);
    passed('logout elimina la sesión y vuelve a proteger las rutas');
    console.log(`${checks} comprobaciones HTTP con PostgreSQL reales correctas; sin probar OAuth interactivo.`);
  } finally {
    server.kill('SIGTERM');
    await Promise.race([new Promise(resolve=>server.once('close',resolve)),delay(3000)]);
    if(server.exitCode===null)server.kill('SIGKILL');
    await db.user.deleteMany({where:{email}});
    await db.loginAttempt.deleteMany({where:{key:attemptKey}});
    await db.requestLimit.deleteMany({where:{key:{in:requestKeys}}});
    await db.$disconnect();
    jar.clear();
  }
}
main().catch(error=>{
  console.error(error instanceof assert.AssertionError ? 'Falló una comprobación de autenticación HTTP aislada: '+error.message.split('\n')[0] : 'No se completó la verificación HTTP aislada. Revisa la configuración y el build; no se muestran secretos.');
  process.exitCode=1;
});
