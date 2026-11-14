import { test } from "node:test";
import assert from "node:assert/strict";
import { authOptions } from "../src/lib/auth";
import { authProviderLabel } from "../src/lib/session-display";
import type { JWT } from "next-auth/jwt";

test('Google y credenciales están configurados y la sesión permanece JWT',()=>{
  const ids=authOptions.providers.map(provider=>provider.id);
  assert.ok(ids.includes('google'));assert.ok(ids.includes('credentials'));
  assert.equal(authOptions.session?.strategy,'jwt');
});
test('el mismo correo en proveedores distintos no se convierte en la misma identidad',async()=>{
  const jwt=authOptions.callbacks!.jwt!;
  const tokens: JWT[]=[];
  for(const provider of ['google','github'] as const){
    tokens.push(await jwt({token:{},account:{provider,providerAccountId:'provider-id',type:'oauth'},user:{id:'provider-id',email:'same@example.test'}}));
  }
  assert.equal(tokens[0].sub,'google:provider-id');assert.equal(tokens[1].sub,'github:provider-id');
  assert.notEqual(tokens[0].sub,tokens[1].sub);
});
test('solo expongo el proveedor e identificador, sin copiar hash o tokens OAuth a la sesión',async()=>{
  const session=await authOptions.callbacks!.session!({session:{user:{name:'Test',email:'test@example.test'},expires:'2030-01-01'},token:{sub:'credentials:test-id',authProvider:'credentials',passwordHash:'must-not-leak',access_token:'must-not-leak'},user:{id:'test-id',email:'test@example.test',emailVerified:null},newSession:undefined,trigger:'update'});
  assert.ok('authProvider' in session);assert.equal(session.authProvider,'credentials');assert.ok(session.user && 'id' in session.user);assert.equal(session.user.id,'credentials:test-id');
  assert.doesNotMatch(JSON.stringify(session),/must-not-leak|passwordHash|access_token/);
});
test('no invento el método de autenticación para sesiones anteriores',()=>assert.equal(authProviderLabel(undefined),'No disponible en esta sesión'));
test('el logger conserva el diagnóstico sin imprimir metadatos sensibles',()=>{
  const previous=console.error;
  const messages: unknown[][]=[];
  console.error=(...args:unknown[])=>{messages.push(args);};
  try { authOptions.logger!.error!('OAUTH_CALLBACK_ERROR',{error:new Error('metadata-must-not-leak')}); }
  finally {console.error=previous;}
  assert.match(JSON.stringify(messages),/OAUTH_CALLBACK_ERROR/);
  assert.doesNotMatch(JSON.stringify(messages),/metadata-must-not-leak/);
});
