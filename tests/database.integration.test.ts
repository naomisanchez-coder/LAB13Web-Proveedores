import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { getDb } from "../src/lib/server/db";
import { hashPassword, verifyPassword } from "../src/lib/server/password";
import { authenticateCredentials } from "../src/lib/server/credentials";
import { consumeLimit, securityKey } from "../src/lib/server/request-security";
import { POST } from "../src/app/api/register/route";

test('PostgreSQL real: registro, duplicados, concurrencia, bloqueo persistente, reinicio y desbloqueo', {skip: !process.env.TEST_DATABASE_URL, timeout:60000}, async()=>{
  // scripts/test.mjs ya verifica que sea una base lab13..._test y aplica las migraciones.
  assert.equal(process.env.DATABASE_URL,process.env.TEST_DATABASE_URL);
  const db=getDb();
  const suffix=randomUUID();
  const email=`auth-${suffix}@example.test`;
  const concurrentEmail=`concurrent-${suffix}@example.test`;
  const password='OnlyForIntegration123';
  const identity=`integration-${suffix}`;
  process.env.VERCEL='1';
  const headers=new Headers({'x-vercel-forwarded-for':'192.0.2.11'});
  const keys=[securityKey('login-account',email),securityKey('login-account',concurrentEmail)];
  const limitKeys=[securityKey('login-ip','192.0.2.11'),securityKey('login-ip','192.0.2.12'),securityKey('register-ip','192.0.2.11'),securityKey('register-email',email),securityKey('test-limit',identity)];
  try {
    const register=()=>POST(new Request('http://localhost:3000/api/register',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.11'},body:JSON.stringify({name:'Integración local',email:` ${email.toUpperCase()} `,password,confirmPassword:password})}));
    const first=await register();assert.equal(first.status,202);
    const duplicate=await register();assert.equal(duplicate.status,202);
    assert.equal(await first.text(),await duplicate.text());
    assert.equal(await db.user.count({where:{email}}),1);
    const stored=await db.user.findUniqueOrThrow({where:{email}});
    assert.notEqual(stored.passwordHash,password);assert.ok(await verifyPassword(password,stored.passwordHash!));
    assert.ok(await authenticateCredentials({email,password},headers));
    for(let i=1;i<=5;i++){
      assert.equal(await authenticateCredentials({email,password:'IncorrectPassword123'},headers),null);
      const attempt=await db.loginAttempt.findUniqueOrThrow({where:{key:keys[0]}});
      assert.equal(attempt.failedAttempts,i);assert.equal(!!attempt.lockedUntil,i===5);
    }
    assert.equal(await authenticateCredentials({email,password},headers),null);
    // Nuevo proceso: demuestra que el bloqueo no depende de memoria local.
    const worker=spawn(process.execPath,['--conditions=react-server','--import','tsx','tests/helpers/auth-worker.ts'],{env:process.env,stdio:['pipe','pipe','pipe']});
    worker.stdin.end(JSON.stringify({email,password}));
    let output='';worker.stdout.on('data',chunk=>output+=chunk);
    worker.stderr.resume();
    const status=await new Promise<number|null>(resolve=>worker.on('close',resolve));
    assert.equal(status,0);assert.equal(JSON.parse(output).authenticated,false);
    // Se adelanta el estado persistente solo en la cuenta de prueba; no se espera 15 minutos.
    await db.loginAttempt.update({where:{key:keys[0]},data:{lockedUntil:new Date(Date.now()-1000)}});
    assert.ok(await authenticateCredentials({email,password},headers));
    const reset=await db.loginAttempt.findUniqueOrThrow({where:{key:keys[0]}});
    assert.equal(reset.failedAttempts,0);assert.equal(reset.lockedUntil,null);
    await db.user.create({data:{name:'Concurrente local',email:concurrentEmail,passwordHash:await hashPassword(password)}});
    const concurrentHeaders=new Headers({'x-vercel-forwarded-for':'192.0.2.12'});
    const failures=await Promise.all(Array.from({length:5},()=>authenticateCredentials({email:concurrentEmail,password:'IncorrectPassword123'},concurrentHeaders)));
    assert.ok(failures.every(value=>value===null));
    const locked=await db.loginAttempt.findUniqueOrThrow({where:{key:keys[1]}});
    assert.equal(locked.failedAttempts,5);assert.ok(locked.lockedUntil);
    assert.equal(await authenticateCredentials({email:concurrentEmail,password},concurrentHeaders),null);
    assert.equal((await consumeLimit('test-limit',identity,2,60)).allowed,true);
    assert.equal((await consumeLimit('test-limit',identity,2,60)).allowed,true);
    assert.equal((await consumeLimit('test-limit',identity,2,60)).allowed,false);
    await db.requestLimit.update({where:{key:securityKey('test-limit',identity)},data:{expiresAt:new Date(Date.now()-1000)}});
    assert.equal((await consumeLimit('test-limit',identity,2,60)).allowed,true);
  } finally {
    await db.user.deleteMany({where:{email:{in:[email,concurrentEmail]}}});
    await db.loginAttempt.deleteMany({where:{key:{in:keys}}});
    await db.requestLimit.deleteMany({where:{key:{in:limitKeys}}});
    await db.$disconnect();
    delete process.env.VERCEL;
  }
});
