import { test } from "node:test";
import assert from "node:assert/strict";
import { BodyError, clientIdentity, readSmallJson, sameOrigin, securityKey } from "../src/lib/server/request-security";
const url='http://localhost:3000/api/register';
test('exijo el origen configurado; rechazo origen ausente, distinto o malformado',()=>{
  assert.equal(sameOrigin(new Request(url,{headers:{origin:'http://localhost:3000'}})),true);
  for(const origin of ['', 'https://attacker.example','null']) assert.equal(sameOrigin(new Request(url,{headers:{origin}})),false);
});
test('no confío en IPs enviadas por clientes fuera de Vercel',()=>{
  delete process.env.VERCEL;
  assert.equal(clientIdentity(new Headers({'x-forwarded-for':'1.2.3.4','x-vercel-forwarded-for':'5.6.7.8'})),'shared-local');
});
test('en Vercel uso únicamente su cabecera y valido la IP',()=>{
  process.env.VERCEL='1';
  assert.equal(clientIdentity(new Headers({'x-vercel-forwarded-for':'192.0.2.1'})),'192.0.2.1');
  assert.equal(clientIdentity(new Headers({'x-vercel-forwarded-for':'not-an-ip'})),'unknown-vercel');
  delete process.env.VERCEL;
});
test('HMAC oculta identificadores y separa el ámbito de cada límite',()=>{
  assert.match(securityKey('login','example@example.test'),/^[a-f0-9]{64}$/);
  assert.notEqual(securityKey('login','example@example.test'),securityKey('register','example@example.test'));
});
test('limito el cuerpo incluso sin Content-Length y rechazo JSON inválido o tipo incorrecto',async()=>{
  for(const [body,headers,status] of [
    ['{}',{'content-type':'text/plain'},415], ['{',{'content-type':'application/json'},400],
    ['x'.repeat(4097),{'content-type':'application/json'},413],
    ['{}',{'content-type':'application/json','content-length':'99999'},413],
  ] as const) await assert.rejects(readSmallJson(new Request(url,{method:'POST',headers,body})),error=>error instanceof BodyError && error.status===status);
  assert.deepEqual(await readSmallJson(new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:'{"ok":true}'})),{ok:true});
});
